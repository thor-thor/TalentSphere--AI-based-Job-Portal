const express = require('express');
const router = express.Router();
const Joi = require('joi');
const path = require('path');
const pool = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const profileSchema = Joi.object({
  headline: Joi.string().max(255),
  summary: Joi.string(),
  location: Joi.string().max(255),
  preferredJobType: Joi.array().items(Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'remote')),
  preferredSalaryMin: Joi.number().min(0),
  preferredSalaryMax: Joi.number().min(0),
  yearsOfExperience: Joi.number().min(0),
  resumeUrl: Joi.string().uri(),
  linkedinUrl: Joi.string().uri(),
  portfolioUrl: Joi.string().uri(),
  noticePeriod: Joi.string().max(50),
  isOpenToWork: Joi.boolean(),
});

const educationSchema = Joi.object({
  institution: Joi.string().max(255).required(),
  degree: Joi.string().max(255).required(),
  fieldOfStudy: Joi.string().max(255),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  isCurrent: Joi.boolean(),
  grade: Joi.string().max(50),
  description: Joi.string(),
});

const experienceSchema = Joi.object({
  companyName: Joi.string().max(255).required(),
  jobTitle: Joi.string().max(255).required(),
  location: Joi.string().max(255),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  isCurrent: Joi.boolean(),
  description: Joi.string(),
});

router.get('/profile', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    let profile;
    if (req.user.role === 'job_seeker') {
      const profileResult = await pool.query(
        `SELECT jsp.*, 
         COALESCE(json_agg(DISTINCT jsonb_build_object('id', e.id, 'institution', e.institution, 'degree', e.degree, 'fieldOfStudy', e.field_of_study, 'startDate', e.start_date, 'endDate', e.end_date, 'isCurrent', e.is_current, 'grade', e.grade, 'description', e.description)) FILTER (WHERE e.id IS NOT NULL), '[]') as education,
         COALESCE(json_agg(DISTINCT jsonb_build_object('id', we.id, 'companyName', we.company_name, 'jobTitle', we.job_title, 'location', we.location, 'startDate', we.start_date, 'endDate', we.end_date, 'isCurrent', we.is_current, 'description', we.description)) FILTER (WHERE we.id IS NOT NULL), '[]') as work_experience,
         COALESCE(json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name, 'proficiencyLevel', js.proficiency_level)) FILTER (WHERE s.id IS NOT NULL), '[]') as skills
         FROM job_seeker_profiles jsp
         LEFT JOIN education e ON e.profile_id = jsp.id
         LEFT JOIN work_experience we ON we.profile_id = jsp.id
         LEFT JOIN job_seeker_skills js ON js.profile_id = jsp.id
         LEFT JOIN skills s ON js.skill_id = s.id
         WHERE jsp.user_id = $1
         GROUP BY jsp.id`,
        [userId]
      );
      profile = profileResult.rows[0];
    }

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.user.id;

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(value).forEach(([key, val]) => {
      if (val !== undefined) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(val);
        paramCount++;
      }
    });

    if (fields.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE job_seeker_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramCount}`,
        values
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

const fs = require('fs');
const aiService = require('../services/aiService');

router.post('/resume', auth, authorize('job_seeker'), upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    const filePath = path.join(__dirname, '../../uploads/resumes', req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);

    // Call AI Service for parsing
    const parsedData = await aiService.parseResume(fileBuffer, req.file.originalname);
    
    let aiMetadata = {};
    if (parsedData && parsedData.extracted_data) {
      aiMetadata = parsedData.extracted_data;
      
      // Optionally update skills automatically
      if (aiMetadata.skills && aiMetadata.skills.length > 0) {
        const profileResult = await pool.query('SELECT id FROM job_seeker_profiles WHERE user_id = $1', [req.user.id]);
        const profileId = profileResult.rows[0].id;
        
        for (const skillName of aiMetadata.skills) {
          // Find or create skill
          let skillRes = await pool.query('SELECT id FROM skills WHERE name ILIKE $1', [skillName]);
          let skillId;
          if (skillRes.rows.length === 0) {
            const newSkill = await pool.query('INSERT INTO skills (name) VALUES ($1) RETURNING id', [skillName]);
            skillId = newSkill.rows[0].id;
          } else {
            skillId = skillRes.rows[0].id;
          }
          
          await pool.query('INSERT INTO job_seeker_skills (profile_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [profileId, skillId]);
        }
      }
    }

    await pool.query(
      'UPDATE job_seeker_profiles SET resume_url = $1, ai_metadata = $2, is_parsed = true, updated_at = NOW() WHERE user_id = $3',
      [resumeUrl, JSON.stringify(aiMetadata), req.user.id]
    );

    res.json({ 
      message: 'Resume uploaded and parsed successfully', 
      resumeUrl,
      extractedSkills: aiMetadata.skills || []
    });
  } catch (error) {
    next(error);
  }
});

router.post('/education', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { error, value } = educationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const profileResult = await pool.query('SELECT id FROM job_seeker_profiles WHERE user_id = $1', [req.user.id]);
    const profileId = profileResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO education (profile_id, institution, degree, field_of_study, start_date, end_date, is_current, grade, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [profileId, value.institution, value.degree, value.fieldOfStudy, value.startDate, value.endDate, value.isCurrent, value.grade, value.description]
    );

    res.status(201).json({ education: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/education/:id', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM education WHERE id = $1 AND profile_id = (SELECT id FROM job_seeker_profiles WHERE user_id = $2)', [id, req.user.id]);

    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/experience', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { error, value } = experienceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const profileResult = await pool.query('SELECT id FROM job_seeker_profiles WHERE user_id = $1', [req.user.id]);
    const profileId = profileResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO work_experience (profile_id, company_name, job_title, location, start_date, end_date, is_current, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [profileId, value.companyName, value.jobTitle, value.location, value.startDate, value.endDate, value.isCurrent, value.description]
    );

    res.status(201).json({ experience: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/experience/:id', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM work_experience WHERE id = $1 AND profile_id = (SELECT id FROM job_seeker_profiles WHERE user_id = $2)', [id, req.user.id]);

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/skills', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { skillIds } = req.body;

    const profileResult = await pool.query('SELECT id FROM job_seeker_profiles WHERE user_id = $1', [req.user.id]);
    const profileId = profileResult.rows[0].id;

    await pool.query('DELETE FROM job_seeker_skills WHERE profile_id = $1', [profileId]);

    for (const skillId of skillIds) {
      await pool.query(
        'INSERT INTO job_seeker_skills (profile_id, skill_id) VALUES ($1, $2)',
        [profileId, skillId]
      );
    }

    res.json({ message: 'Skills updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/saved-jobs', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT j.*, c.name as company_name, c.logo_url as company_logo
       FROM saved_jobs sj
       JOIN jobs j ON sj.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE sj.user_id = $1
       ORDER BY sj.created_at DESC`,
      [req.user.id]
    );

    res.json({ savedJobs: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/saved-jobs/:jobId', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { jobId } = req.params;

    await pool.query(
      'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, jobId]
    );

    res.json({ message: 'Job saved successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/saved-jobs/:jobId', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const { jobId } = req.params;

    await pool.query('DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2', [req.user.id, jobId]);

    res.json({ message: 'Job unsaved successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;