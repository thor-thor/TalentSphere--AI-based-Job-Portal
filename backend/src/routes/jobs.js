const express = require('express');
const router = express.Router();
const Joi = require('joi');
const pool = require('../config/database');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { sendJobPostedConfirmation } = require('../config/mail');

const createJobSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  requirements: Joi.string(),
  responsibilities: Joi.string(),
  benefits: Joi.array().items(Joi.string()),
  jobType: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'remote').required(),
  experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'executive'),
  location: Joi.string().max(255),
  remoteType: Joi.string().valid('onsite', 'remote', 'hybrid'),
  salaryMin: Joi.number().min(0),
  salaryMax: Joi.number().min(0),
  salaryCurrency: Joi.string().max(10).default('USD'),
  isSalaryVisible: Joi.boolean().default(true),
  applicationDeadline: Joi.date(),
  skillIds: Joi.array().items(Joi.string()),
});

const updateJobSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string(),
  requirements: Joi.string(),
  responsibilities: Joi.string(),
  benefits: Joi.array().items(Joi.string()),
  jobType: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'remote'),
  experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'executive'),
  location: Joi.string().max(255),
  remoteType: Joi.string().valid('onsite', 'remote', 'hybrid'),
  salaryMin: Joi.number().min(0),
  salaryMax: Joi.number().min(0),
  salaryCurrency: Joi.string().max(10),
  isSalaryVisible: Joi.boolean(),
  applicationDeadline: Joi.date(),
  isActive: Joi.boolean(),
  skillIds: Joi.array().items(Joi.string()),
});

const jobQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  search: Joi.string(),
  jobType: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'remote'),
  experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'executive'),
  location: Joi.string(),
  remoteType: Joi.string().valid('onsite', 'remote', 'hybrid'),
  salaryMin: Joi.number().min(0),
  salaryMax: Joi.number().min(0),
  companyId: Joi.string().uuid(),
  sortBy: Joi.string().valid('created_at', 'salary_min', 'views_count').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { error, value } = jobQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, limit, search, jobType, experienceLevel, location, remoteType, salaryMin, salaryMax, companyId, sortBy, sortOrder } = value;
    const offset = (page - 1) * limit;

    let conditions = ['j.is_active = true', 'j.is_approved = true'];
    let params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(j.title ILIKE $${paramCount} OR j.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (jobType) {
      conditions.push(`j.job_type = $${paramCount}`);
      params.push(jobType);
      paramCount++;
    }

    if (experienceLevel) {
      conditions.push(`j.experience_level = $${paramCount}`);
      params.push(experienceLevel);
      paramCount++;
    }

    if (location) {
      conditions.push(`j.location ILIKE $${paramCount}`);
      params.push(`%${location}%`);
      paramCount++;
    }

    if (remoteType) {
      conditions.push(`j.remote_type = $${paramCount}`);
      params.push(remoteType);
      paramCount++;
    }

    if (salaryMin) {
      conditions.push(`j.salary_max >= $${paramCount}`);
      params.push(salaryMin);
      paramCount++;
    }

    if (salaryMax) {
      conditions.push(`j.salary_min <= $${paramCount}`);
      params.push(salaryMax);
      paramCount++;
    }

    if (companyId) {
      conditions.push(`j.company_id = $${paramCount}`);
      params.push(companyId);
      paramCount++;
    }

    const whereClause = conditions.join(' AND ');
    const orderClause = `${sortBy === 'salary_min' ? 'COALESCE(j.salary_min, 0)' : 'j.' + sortBy} ${sortOrder.toUpperCase()}`;

    // Count query parameters are just the filter parameters
    const countParams = [...params];
    const countQuery = `SELECT COUNT(*) FROM jobs j WHERE ${whereClause}`;

    // Data query parameters include filters, limit, offset, and optionally user_id
    const dataParams = [...params];
    const limitIdx = dataParams.length + 1;
    const offsetIdx = dataParams.length + 2;
    dataParams.push(limit, offset);

    let dataQuery;
    if (req.user && req.user.role === 'job_seeker') {
      const userIdIdx = dataParams.length + 1;
      dataParams.push(req.user.id);
      
      dataQuery = `
        SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry,
               COALESCE(sub.match_percentage, 0) as match_percentage
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        LEFT JOIN (
          SELECT js.job_id,
                 CASE 
                   WHEN COUNT(*) > 0 
                   THEN ROUND((SUM(CASE WHEN jss.skill_id IS NOT NULL THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100) 
                   ELSE 0 
                 END as match_percentage
          FROM job_skills js
          LEFT JOIN job_seeker_profiles p ON p.user_id = $${userIdIdx}
          LEFT JOIN job_seeker_skills jss ON js.skill_id = jss.skill_id AND jss.profile_id = p.id
          GROUP BY js.job_id
        ) sub ON sub.job_id = j.id
        WHERE ${whereClause}
        ORDER BY j.is_featured DESC, ${orderClause}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    } else {
      dataQuery = `
        SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry,
               0 as match_percentage
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE ${whereClause}
        ORDER BY j.is_featured DESC, ${orderClause}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    }

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      jobs: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/match', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ error: 'Only job seekers can use the job matcher' });
    }

    const { limit = 10 } = req.query;

    const matchQuery = `
      SELECT 
        j.*, c.name as company_name, c.logo_url as company_logo, c.industry,
        COALESCE(sub.matching_skills, 0) as matching_skills, 
        COALESCE(sub.total_skills, 0) as total_skills,
        CASE 
          WHEN COALESCE(sub.total_skills, 0) > 0 
          THEN ROUND((COALESCE(sub.matching_skills, 0)::NUMERIC / sub.total_skills::NUMERIC) * 100) 
          ELSE 0 
        END as match_percentage
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      LEFT JOIN (
        SELECT js.job_id,
               COUNT(*) as total_skills,
               SUM(CASE WHEN jss.skill_id IS NOT NULL THEN 1 ELSE 0 END) as matching_skills
        FROM job_skills js
        LEFT JOIN job_seeker_profiles p ON p.user_id = $1
        LEFT JOIN job_seeker_skills jss ON js.skill_id = jss.skill_id AND jss.profile_id = p.id
        GROUP BY js.job_id
      ) sub ON sub.job_id = j.id
      WHERE j.is_active = true AND j.is_approved = true
      ORDER BY match_percentage DESC, j.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(matchQuery, [req.user.id, limit]);

    res.json({ jobs: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry, c.company_size, c.headquarters, c.website
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       WHERE j.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    let skillsQuery;
    let skillsParams;

    if (req.user && req.user.role === 'job_seeker') {
      skillsQuery = `
        SELECT s.id, s.name, js.is_required,
               CASE WHEN jss.skill_id IS NOT NULL THEN TRUE ELSE FALSE END as is_matched
        FROM job_skills js
        JOIN skills s ON js.skill_id = s.id
        LEFT JOIN job_seeker_profiles p ON p.user_id = $2
        LEFT JOIN job_seeker_skills jss ON js.skill_id = jss.skill_id AND jss.profile_id = p.id
        WHERE js.job_id = $1
      `;
      skillsParams = [id, req.user.id];
    } else {
      skillsQuery = `
        SELECT s.id, s.name, js.is_required, FALSE as is_matched
        FROM job_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE js.job_id = $1
      `;
      skillsParams = [id];
    }

    const skillsResult = await pool.query(skillsQuery, skillsParams);
    job.skills = skillsResult.rows;

    await pool.query('UPDATE jobs SET views_count = views_count + 1 WHERE id = $1', [id]);

    let isSaved = false;
    let matchPercentage = 0;

    if (req.user) {
      const savedResult = await pool.query(
        'SELECT id FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
        [req.user.id, id]
      );
      isSaved = savedResult.rows.length > 0;

      if (req.user.role === 'job_seeker') {
        const matchResult = await pool.query(
          `SELECT 
             CASE 
               WHEN COUNT(*) > 0 
               THEN ROUND((SUM(CASE WHEN jss.skill_id IS NOT NULL THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100) 
               ELSE 0 
             END as match_percentage
           FROM job_skills js
           LEFT JOIN job_seeker_profiles p ON p.user_id = $1
           LEFT JOIN job_seeker_skills jss ON js.skill_id = jss.skill_id AND jss.profile_id = p.id
           WHERE js.job_id = $2`,
          [req.user.id, id]
        );
        matchPercentage = matchResult.rows[0].match_percentage;
      }
    }
    job.isSaved = isSaved;
    job.match_percentage = matchPercentage;

    res.json({ job });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, authorize('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { error, value } = createJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const companyResult = await pool.query(
      'SELECT id FROM companies WHERE user_id = $1',
      [req.user.id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(400).json({ error: 'Company profile not found. Please create a company first.' });
    }

    const companyId = companyResult.rows[0].id;
    const slug = value.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const fields = ['company_id', 'recruiter_id', 'title', 'slug', 'description', 'job_type', 'is_approved'];
    const placeholders = ['$1', '$2', '$3', '$4', '$5', '$6', '$7'];
    const values = [companyId, req.user.id, value.title, slug, value.description, value.jobType, true];
    let paramCount = 8;

    if (value.requirements) {
      fields.push('requirements');
      placeholders.push(`$${paramCount}`);
      values.push(value.requirements);
      paramCount++;
    }

    if (value.responsibilities) {
      fields.push('responsibilities');
      placeholders.push(`$${paramCount}`);
      values.push(value.responsibilities);
      paramCount++;
    }

    if (value.benefits) {
      fields.push('benefits');
      placeholders.push(`$${paramCount}`);
      values.push(value.benefits);
      paramCount++;
    }

    if (value.experienceLevel) {
      fields.push('experience_level');
      placeholders.push(`$${paramCount}`);
      values.push(value.experienceLevel);
      paramCount++;
    }

    if (value.location) {
      fields.push('location');
      placeholders.push(`$${paramCount}`);
      values.push(value.location);
      paramCount++;
    }

    if (value.remoteType) {
      fields.push('remote_type');
      placeholders.push(`$${paramCount}`);
      values.push(value.remoteType);
      paramCount++;
    }

    if (value.salaryMin) {
      fields.push('salary_min');
      placeholders.push(`$${paramCount}`);
      values.push(value.salaryMin);
      paramCount++;
    }

    if (value.salaryMax) {
      fields.push('salary_max');
      placeholders.push(`$${paramCount}`);
      values.push(value.salaryMax);
      paramCount++;
    }

    if (value.applicationDeadline) {
      fields.push('application_deadline');
      placeholders.push(`$${paramCount}`);
      values.push(value.applicationDeadline);
      paramCount++;
    }

    const result = await pool.query(
      `INSERT INTO jobs (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );

    const jobId = result.rows[0].id;


    if (value.skillIds && value.skillIds.length > 0) {
      for (const skillId of value.skillIds) {
        await pool.query(
          'INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
          [jobId, skillId]
        );
      }
    }

    const companyInfoResult = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
    sendJobPostedConfirmation(
      req.user.email,
      req.user.first_name,
      value.title,
      companyInfoResult.rows[0]?.name || ''
    );

    res.status(201).json({ job: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, authorize('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { error, value } = updateJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { id } = req.params;

    let jobResult;
    if (req.user.role === 'admin') {
      jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    } else {
      jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1 AND recruiter_id = $2', [id, req.user.id]);
    }

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMapping = {
      title: 'title',
      description: 'description',
      requirements: 'requirements',
      responsibilities: 'responsibilities',
      benefits: 'benefits',
      jobType: 'job_type',
      experienceLevel: 'experience_level',
      location: 'location',
      remoteType: 'remote_type',
      salaryMin: 'salary_min',
      salaryMax: 'salary_max',
      salaryCurrency: 'salary_currency',
      isSalaryVisible: 'is_salary_visible',
      applicationDeadline: 'application_deadline',
      isActive: 'is_active',
    };

    Object.entries(value).forEach(([key, val]) => {
      if (val !== undefined && fieldMapping[key]) {
        fields.push(`${fieldMapping[key]} = $${paramCount}`);
        values.push(val);
        paramCount++;
      }
    });

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE jobs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
        values
      );
    }

    if (value.skillIds) {
      await pool.query('DELETE FROM job_skills WHERE job_id = $1', [id]);
      for (const skillId of value.skillIds) {
        await pool.query(
          'INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ($1, $2, true)',
          [id, skillId]
        );
      }
    }

    const updatedJob = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);

    res.json({ job: updatedJob.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, authorize('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id]);
    } else {
      result = await pool.query('DELETE FROM jobs WHERE id = $1 AND recruiter_id = $2 RETURNING id', [id, req.user.id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/my-jobs/list', auth, authorize('recruiter'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT j.*, 
       (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
       FROM jobs j
       WHERE j.recruiter_id = $1
       ORDER BY j.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM jobs WHERE recruiter_id = $1',
      [req.user.id]
    );

    res.json({
      jobs: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;