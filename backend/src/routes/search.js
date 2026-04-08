const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

router.get('/jobs', optionalAuth, async (req, res, next) => {
  try {
    const { q, location, jobType, remoteType, salaryMin, salaryMax, experienceLevel, skills, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['j.is_active = true', 'j.is_approved = true'];
    let params = [];
    let paramCount = 1;

    if (q) {
      conditions.push(`(to_tsvector('english', j.title) @@ to_tsquery($${paramCount}) OR to_tsvector('english', j.description) @@ to_tsquery($${paramCount}))`);
      params.push(q.split(' ').join(' & '));
      paramCount++;
    }

    if (location) {
      conditions.push(`j.location ILIKE $${paramCount}`);
      params.push(`%${location}%`);
      paramCount++;
    }

    if (jobType) {
      conditions.push(`j.job_type = $${paramCount}`);
      params.push(jobType);
      paramCount++;
    }

    if (remoteType) {
      conditions.push(`j.remote_type = $${paramCount}`);
      params.push(remoteType);
      paramCount++;
    }

    if (salaryMin) {
      conditions.push(`j.salary_max >= $${paramCount}`);
      params.push(parseInt(salaryMin));
      paramCount++;
    }

    if (salaryMax) {
      conditions.push(`j.salary_min <= $${paramCount}`);
      params.push(parseInt(salaryMax));
      paramCount++;
    }

    if (experienceLevel) {
      conditions.push(`j.experience_level = $${paramCount}`);
      params.push(experienceLevel);
      paramCount++;
    }

    if (skills) {
      conditions.push(`EXISTS (
        SELECT 1 FROM job_skills js 
        JOIN skills s ON js.skill_id = s.id 
        WHERE js.job_id = j.id AND s.name = ANY($${paramCount}::text[])
      )`);
      params.push(skills.split(','));
      paramCount++;
    }

    const whereClause = conditions.join(' AND ');
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry,
              array_agg(s.name) FILTER (WHERE s.name IS NOT NULL) as skills
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       LEFT JOIN job_skills js ON j.id = js.job_id
       LEFT JOIN skills s ON js.skill_id = s.id
       WHERE ${whereClause}
       GROUP BY j.id, c.id
       ORDER BY j.is_featured DESC, j.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countQuery = `SELECT COUNT(DISTINCT j.id) FROM jobs j WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      jobs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const [jobsResult, companiesResult, skillsResult] = await Promise.all([
      pool.query(
        `SELECT DISTINCT title FROM jobs WHERE title ILIKE $1 AND is_active = true LIMIT 5`,
        [`%${q}%`]
      ),
      pool.query(
        `SELECT DISTINCT name FROM companies WHERE name ILIKE $1 AND is_active = true LIMIT 5`,
        [`%${q}%`]
      ),
      pool.query(
        `SELECT name FROM skills WHERE name ILIKE $1 LIMIT 5`,
        [`%${q}%`]
      ),
    ]);

    const suggestions = [
      ...jobsResult.rows.map(r => ({ type: 'job_title', value: r.title })),
      ...companiesResult.rows.map(r => ({ type: 'company', value: r.name })),
      ...skillsResult.rows.map(r => ({ type: 'skill', value: r.name })),
    ];

    res.json({ suggestions: suggestions.slice(0, 10) });
  } catch (error) {
    next(error);
  }
});

router.get('/candidates', optionalAuth, async (req, res, next) => {
  try {
    const { skills, experienceMin, experienceMax, location, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['u.is_active = true'];
    let params = [];
    let paramCount = 1;

    if (skills) {
      conditions.push(`EXISTS (
        SELECT 1 FROM job_seeker_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE js.profile_id = jp.id AND s.name = ANY($${paramCount}::text[])
      )`);
      params.push(skills.split(','));
      paramCount++;
    }

    if (experienceMin) {
      conditions.push(`jp.years_of_experience >= $${paramCount}`);
      params.push(parseInt(experienceMin));
      paramCount++;
    }

    if (experienceMax) {
      conditions.push(`jp.years_of_experience <= $${paramCount}`);
      params.push(parseInt(experienceMax));
      paramCount++;
    }

    if (location) {
      conditions.push(`jp.location ILIKE $${paramCount}`);
      params.push(`%${location}%`);
      paramCount++;
    }

    const whereClause = conditions.join(' AND ');
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, jp.headline, jp.location, jp.years_of_experience, jp.is_open_to_work,
              array_agg(s.name) FILTER (WHERE s.name IS NOT NULL) as skills
       FROM users u
       JOIN job_seeker_profiles jp ON jp.user_id = u.id
       LEFT JOIN job_seeker_skills js ON js.profile_id = jp.id
       LEFT JOIN skills s ON js.skill_id = s.id
       WHERE ${whereClause}
       GROUP BY u.id, jp.id
       ORDER BY jp.years_of_experience DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT u.id) FROM users u JOIN job_seeker_profiles jp ON jp.user_id = u.id WHERE ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      candidates: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;