const chatbotService = require('../services/chatbotService');

const chatbotController = {
  chat: async (req, res, next) => {
    try {
      const { message } = req.body;
      const userId = req.user ? req.user.id : 'anonymous'; // Fallback for testing/unauthenticated

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const rasaResponses = await chatbotService.sendMessage(userId, message);
      
      let combinedResponse;
      if (Array.isArray(rasaResponses)) {
        combinedResponse = rasaResponses.map(r => r.text).join('\n\n');
      } else if (typeof rasaResponses === 'string') {
        combinedResponse = rasaResponses;
      } else {
        combinedResponse = "I'm not exactly sure what you mean. Could you rephrase your question?";
      }

      res.json({ response: combinedResponse });
    } catch (error) {
      console.error('Chatbot Controller Error:', error);
      res.status(500).json({ error: 'Failed to communicate with AI chat service.' });
    }
  }
};

module.exports = chatbotController;
