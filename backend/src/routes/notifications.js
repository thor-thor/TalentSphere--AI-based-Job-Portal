const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['user_id = $1'];
    let params = [req.user.id];

    if (unreadOnly === 'true') {
      conditions.push('is_read = false');
    }

    const whereClause = conditions.join(' AND ');
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 ${unreadOnly === 'true' ? 'AND is_read = false' : ''}`,
      [req.user.id]
    );

    const unreadCount = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
      unreadCount: parseInt(unreadCount.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', auth, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;