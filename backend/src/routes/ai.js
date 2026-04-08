const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const aiService = require('../services/aiService');

// @route   POST api/ai/chat
// @desc    Chat with AI assistant
// @access  Private
router.post('/chat', auth, async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiResponse = await aiService.chat(userId, message);
    res.json(aiResponse);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
