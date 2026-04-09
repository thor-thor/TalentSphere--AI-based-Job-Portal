const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { auth } = require('../middleware/auth');

// @route   POST /api/chatbot
// @desc    Send a message to the AI chatbot and receive a response
// @access  Private (optional: allow both auth and unauth users)
router.post('/', auth, chatbotController.chat);

module.exports = router;
