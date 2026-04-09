const axios = require('axios');

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

const chatbotService = {
  /**
   * Send a user message to the Rasa REST API and get responses.
   * @param {string} userId - Unique user identifier (used as Rasa sender_id)
   * @param {string} message - The user's raw text message
   * @returns {Promise<string>} - Combined text response from Rasa
   */
  sendMessage: async (userId, message) => {
    try {
      const response = await axios.post(
        `${RASA_URL}/webhooks/rest/webhook`,
        {
          sender: userId,
          message: message
        },
        { timeout: 10000 } // 10s timeout
      );

      const rasaMessages = response.data;

      // Rasa can return multiple message objects; combine their text fields
      if (rasaMessages && rasaMessages.length > 0) {
        return rasaMessages
          .filter(m => m.text)
          .map(m => m.text)
          .join('\n\n');
      }

      return "I'm not sure how to help with that. Try asking about jobs, skills, or profile recommendations!";
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error('Chatbot Service: Rasa server is unavailable at', RASA_URL);
        // Graceful fallback — keep the chat working even without Rasa
        return chatbotService.fallbackResponse(message);
      }
      console.error('Chatbot Service Error:', error.message);
      throw new Error('Failed to connect to AI chatbot');
    }
  },

  /**
   * Rule-based fallback when Rasa is unavailable.
   * Keeps the chatbot functional during development or if Rasa hasn't been trained yet.
   */
  fallbackResponse: (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "Hello! I'm your TalentSphere AI assistant. I can help you find jobs, suggest skills, or explore roles matching your profile.";
    }
    if (msg.includes('frontend') || msg.includes('react') || msg.includes('vue')) {
      return "Great interest! Frontend roles like React Developer, UI Engineer, and Web Developer are in high demand. Check the Jobs page for live listings!";
    }
    if (msg.includes('backend') || msg.includes('node') || msg.includes('python') || msg.includes('api')) {
      return "Backend roles are booming! Look for Node.js Developer, Python Engineer, or API Developer roles on the Jobs page.";
    }
    if (msg.includes('skill') || msg.includes('learn') || msg.includes('study')) {
      return "Top skills right now: JavaScript, React, Node.js, Python, TypeScript, Docker, and Cloud (AWS/GCP). Focus on building real projects!";
    }
    if (msg.includes('job') || msg.includes('find') || msg.includes('search')) {
      return "Head over to the Jobs page to browse all active listings. You can filter by type, location, and experience level!";
    }
    if (msg.includes('profile') || msg.includes('recommend') || msg.includes('match')) {
      return "Make sure your profile has your skills listed! I'll use them to match you with the best job openings.";
    }
    if (msg.includes('resume') || msg.includes('cv')) {
      return "Upload your resume in the Profile section to get an ATS score and smart job matching!";
    }
    if (msg.includes('bye') || msg.includes('goodbye')) {
      return "Goodbye! Best of luck with your job search. Come back anytime!";
    }
    return "I can help you find jobs, suggest skills to learn, or show profile-based recommendations. What would you like to explore?";
  }
};

module.exports = chatbotService;
