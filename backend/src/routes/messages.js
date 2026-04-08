const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// Note: Using the auth middleware to protect these routes
// If the auth middleware is not available or named differently, this might need tweaking.

// Get conversations (latest message per user you chatted with)
router.get('/conversations', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // We want to group by the OTHER user in the conversation
    const result = await pool.query(
      `WITH RankedMessages AS (
         SELECT 
           m.*,
           CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
           ROW_NUMBER() OVER(
             PARTITION BY CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END 
             ORDER BY m.created_at DESC
           ) as rn
         FROM messages m
         WHERE m.sender_id = $1 OR m.receiver_id = $1
       )
       SELECT 
         rm.id, rm.content, rm.is_read, rm.created_at, rm.sender_id, rm.receiver_id,
         u.id as user_id, u.first_name, u.last_name, u.profile_picture, u.role
       FROM RankedMessages rm
       JOIN users u ON u.id = rm.other_user_id
       WHERE rm.rn = 1
       ORDER BY rm.created_at DESC`,
      [userId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get messages with a specific user
router.get('/:otherUserId', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const result = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, u.profile_picture 
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [userId, otherUserId]
    );

    // Optionally mark them as read
    await pool.query(
      `UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`,
      [userId, otherUserId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
