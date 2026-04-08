const express = require('express');
const router = express.Router();
const Joi = require('joi');
const pool = require('../config/database');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

const companySchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string(),
  industry: Joi.string().max(255),
  companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
  foundedYear: Joi.number().min(1800).max(new Date().getFullYear()),
  website: Joi.string().uri(),
  headquarters: Joi.string().max(255),
  locations: Joi.array().items(Joi.string()),
  benefits: Joi.array().items(Joi.string()),
});

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, industry } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['c.is_active = true'];
    let params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(c.name ILIKE $${paramCount} OR c.industry ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (industry) {
      conditions.push(`c.industry = $${paramCount}`);
      params.push(industry);
      paramCount++;
    }

    const whereClause = conditions.join(' AND ');
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT c.id, c.name, c.logo_url, c.industry, c.company_size, c.headquarters,
              (SELECT AVG(rating) FROM company_reviews WHERE company_id = c.id AND is_approved = true) as average_rating,
              (SELECT COUNT(*) FROM company_reviews WHERE company_id = c.id AND is_approved = true) as review_count,
              (SELECT COUNT(*) FROM jobs WHERE company_id = c.id AND is_active = true AND is_approved = true) as job_count
       FROM companies c
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM companies c WHERE ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      companies: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my-company', auth, authorize('recruiter'), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM companies WHERE user_id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const company = result.rows[0];

    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE is_active = true AND is_approved = true) as active_jobs,
        COUNT(*) FILTER (WHERE is_active = true) as total_applications
       FROM jobs WHERE company_id = $1`,
      [company.id]
    );
    company.stats = statsResult.rows[0];

    res.json({ company });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = result.rows[0];

    const reviewsResult = await pool.query(
      `SELECT cr.*, u.first_name, u.last_name
       FROM company_reviews cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.company_id = $1 AND cr.is_approved = true
       ORDER BY cr.created_at DESC
       LIMIT 10`,
      [id]
    );
    company.reviews = reviewsResult.rows;

    const statsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT j.id) as job_count,
        COUNT(DISTINCT a.applicant_id) as applicant_count,
        AVG(cr.rating) as average_rating
       FROM companies c
       LEFT JOIN jobs j ON j.company_id = c.id AND j.is_active = true AND j.is_approved = true
       LEFT JOIN applications a ON a.job_id = j.id
       LEFT JOIN company_reviews cr ON cr.company_id = c.id AND cr.is_approved = true
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    company.stats = statsResult.rows[0];

    res.json({ company });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, authorize('recruiter'), async (req, res, next) => {
  try {
    const { error, value } = companySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingCompany = await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user.id]);
    if (existingCompany.rows.length > 0) {
      return res.status(409).json({ error: 'Company profile already exists' });
    }

    const slug = value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await pool.query(
      `INSERT INTO companies (user_id, name, slug, description, industry, company_size, founded_year, website, headquarters, locations, benefits)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.user.id, value.name, slug, value.description, value.industry, value.companySize, value.foundedYear, value.website, value.headquarters, value.locations, value.benefits]
    );

    res.status(201).json({ company: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, authorize('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { error, value } = companySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { id } = req.params;

    let companyResult;
    if (req.user.role === 'admin') {
      companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    } else {
      companyResult = await pool.query('SELECT * FROM companies WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    }

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMapping = {
      name: 'name',
      description: 'description',
      industry: 'industry',
      companySize: 'company_size',
      foundedYear: 'founded_year',
      website: 'website',
      headquarters: 'headquarters',
      locations: 'locations',
      benefits: 'benefits',
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
        `UPDATE companies SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
        values
      );
    }

    const updatedCompany = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);

    res.json({ company: updatedCompany.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/jobs', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT j.*, c.name as company_name, c.logo_url as company_logo
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       WHERE c.id = $1 AND j.is_active = true AND j.is_approved = true
       ORDER BY j.is_featured DESC, j.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND is_active = true AND is_approved = true`,
      [id]
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