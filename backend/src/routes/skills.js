const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;

    let conditions = [];
    let params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`name ILIKE $${paramCount}`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (category) {
      conditions.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM skills ${whereClause} ORDER BY name LIMIT 50`,
      params
    );

    res.json({ skills: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const existingSkill = await pool.query('SELECT id FROM skills WHERE LOWER(name) = LOWER($1)', [name]);
    if (existingSkill.rows.length > 0) {
      return res.status(409).json({ error: 'Skill already exists', skill: existingSkill.rows[0] });
    }

    const result = await pool.query(
      'INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING *',
      [name.trim(), category || null]
    );

    res.status(201).json({ skill: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM skills WHERE category IS NOT NULL ORDER BY category'
    );

    res.json({ categories: result.rows.map(r => r.category) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;