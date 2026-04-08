const express = require('express');
const router = express.Router();
const Joi = require('joi');
const pool = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth');

const reviewSchema = Joi.object({
  companyId: Joi.string().uuid().required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().max(255),
  pros: Joi.string().max(2000),
  cons: Joi.string().max(2000),
  advice: Joi.string().max(2000),
  isAnonymous: Joi.boolean().default(false),
});

router.get('/company/:companyId', async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT cr.*, 
       CASE WHEN cr.is_anonymous THEN NULL ELSE json_build_object('firstName', u.first_name, 'lastName', u.last_name) END as reviewer
       FROM company_reviews cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.company_id = $1 AND cr.is_approved = true
       ORDER BY cr.${sortBy} ${sortOrder.toUpperCase()}
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM company_reviews WHERE company_id = $1 AND is_approved = true',
      [companyId]
    );

    const statsResult = await pool.query(
      `SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE rating = 5) as five_star,
        COUNT(*) FILTER (WHERE rating = 4) as four_star,
        COUNT(*) FILTER (WHERE rating = 3) as three_star,
        COUNT(*) FILTER (WHERE rating = 2) as two_star,
        COUNT(*) FILTER (WHERE rating = 1) as one_star
       FROM company_reviews WHERE company_id = $1 AND is_approved = true`,
      [companyId]
    );

    res.json({
      reviews: result.rows,
      stats: statsResult.rows[0],
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingReview = await pool.query(
      'SELECT id FROM company_reviews WHERE company_id = $1 AND user_id = $2',
      [value.companyId, req.user.id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this company' });
    }

    const result = await pool.query(
      `INSERT INTO company_reviews (company_id, user_id, rating, title, pros, cons, advice, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [value.companyId, req.user.id, value.rating, value.title, value.pros, value.cons, value.advice, value.isAnonymous]
    );

    res.status(201).json({ review: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/helpful', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingVote = await pool.query(
      'SELECT id FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingVote.rows.length > 0) {
      await pool.query('DELETE FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2', [id, req.user.id]);
      await pool.query('UPDATE company_reviews SET helpful_count = helpful_count - 1 WHERE id = $1', [id]);
      

      return res.json({ message: 'Vote removed' });
    }

    await pool.query(
      'INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2)',
      [id, req.user.id]
    );
    await pool.query('UPDATE company_reviews SET helpful_count = helpful_count + 1 WHERE id = $1', [id]);

    res.json({ message: 'Vote added' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;