const express = require('express');
const router = express.Router();
const Joi = require('joi');
const pool = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { sendApplicationConfirmation, sendNewApplicationToEmployer } = require('../config/mail');

const applySchema = Joi.object({
  jobId: Joi.string().uuid().required(),
  coverLetter: Joi.string().max(2000),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('viewed', 'shortlisted', 'rejected', 'interview_scheduled', 'offer_extended', 'hired').required(),
  note: Joi.string().max(1000),
});

router.post('/', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { error, value } = applySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { jobId, coverLetter } = value;

    const jobResult = await pool.query(
      `SELECT j.*, c.name as company_name 
       FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       WHERE j.id = $1 AND j.is_active = true AND j.is_approved = true`, 
      [jobId]
    );
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or not accepting applications' });
    }

    const existingApplication = await pool.query(
      'SELECT id FROM applications WHERE job_id = $1 AND applicant_id = $2',
      [jobId, req.user.id]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }

    const profileResult = await pool.query('SELECT resume_url FROM job_seeker_profiles WHERE user_id = $1', [req.user.id]);
    const resumeUrl = profileResult.rows[0]?.resume_url;

    const result = await pool.query(
      `INSERT INTO applications (job_id, applicant_id, cover_letter, resume_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [jobId, req.user.id, coverLetter, resumeUrl]
    );

    await pool.query('UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1', [jobId]);

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'application_received', 'New Application', 'You have received a new application', $2)`,
      [jobResult.rows[0].recruiter_id, JSON.stringify({ jobId, applicationId: result.rows[0].id })]
    );

    sendApplicationConfirmation(req.user.email, `${req.user.first_name} ${req.user.last_name}`, jobResult.rows[0].title, jobResult.rows[0].company_name);

    const employerResult = await pool.query(
      'SELECT u.email, u.first_name, u.last_name FROM users u JOIN jobs j ON j.recruiter_id = u.id WHERE j.id = $1',
      [jobId]
    );
    if (employerResult.rows.length > 0) {
      sendNewApplicationToEmployer(
        employerResult.rows[0].email,
        employerResult.rows[0].first_name,
        `${req.user.first_name} ${req.user.last_name}`,
        jobResult.rows[0].title,
        jobResult.rows[0].company_name
      );
    }

    res.status(201).json({ application: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const applicationResult = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (applicationResult.rows[0].applicant_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM applications WHERE id = $1', [id]);
    await pool.query('UPDATE jobs SET applications_count = applications_count - 1 WHERE id = $1', [applicationResult.rows[0].job_id]);

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [req.user.id];
    let paramCount = 2;

    if (req.user.role === 'job_seeker') {
      conditions.push('a.applicant_id = $1');
    } else if (req.user.role === 'recruiter') {
      conditions.push(`j.recruiter_id = $1`);
    }

    if (status) {
      conditions.push(`a.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    params.push(limit, offset);
    const whereClause = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT a.*, j.title as job_title, j.location as job_location, c.name as company_name, c.logo_url as company_logo,
              u.first_name, u.last_name, u.email
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       JOIN users u ON a.applicant_id = u.id
       WHERE ${whereClause}
       ORDER BY a.applied_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE ${req.user.role === 'job_seeker' ? 'a.applicant_id = $1' : 'j.recruiter_id = $1'}${status ? ' AND a.status = $2' : ''}`,
      params.slice(0, status ? 2 : 1)
    );

    res.json({
      applications: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const applicationResult = await pool.query(
      `SELECT a.*, j.title as job_title, j.location as job_location, c.name as company_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.id = $1`,
      [id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applicationResult.rows[0];

    if (req.user.role === 'recruiter' && application.recruiter_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'job_seeker' && application.applicant_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const statusHistory = await pool.query(
      `SELECT ash.*, u.first_name, u.last_name
       FROM application_status_history ash
       LEFT JOIN users u ON ash.changed_by = u.id
       WHERE ash.application_id = $1
       ORDER BY ash.created_at DESC`,
      [id]
    );
    application.statusHistory = statusHistory.rows;

    res.json({ application });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', auth, authorize('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { id } = req.params;
    const { status, note } = value;

    const applicationResult = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (req.user.role === 'recruiter') {
      const jobResult = await pool.query('SELECT recruiter_id FROM jobs WHERE id = $1', [applicationResult.rows[0].job_id]);
      if (jobResult.rows[0].recruiter_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await pool.query(
      'UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    await pool.query(
      `INSERT INTO application_status_history (application_id, status, note, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, status, note, req.user.id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'application_status', 'Application Status Update', $2, $3)`,
      [applicationResult.rows[0].applicant_id, `Your application status has been updated to ${status.replace('_', ' ')}`, JSON.stringify({ applicationId: id, status })]
    );

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/schedule', auth, authorize('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { scheduledAt, durationMinutes = 60, meetingLink, location, notes } = req.body;

    const applicationResult = await pool.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const result = await pool.query(
      `INSERT INTO interview_schedules (application_id, scheduled_by, scheduled_at, duration_minutes, meeting_link, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.params.id, req.user.id, scheduledAt, durationMinutes, meetingLink, location, notes]
    );

    await pool.query(
      'UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2',
      ['interview_scheduled', req.params.id]
    );

    await pool.query(
      `INSERT INTO application_status_history (application_id, status, note, changed_by)
       VALUES ($1, 'interview_scheduled', $2, $3)`,
      [req.params.id, `Interview scheduled for ${new Date(scheduledAt).toLocaleString()}`, req.user.id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'interview_scheduled', 'Interview Scheduled', $2, $3)`,
      [applicationResult.rows[0].applicant_id, `Your interview has been scheduled for ${new Date(scheduledAt).toLocaleString()}`, JSON.stringify({ applicationId: req.params.id, interviewId: result.rows[0].id })]
    );

    res.status(201).json({ interview: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;