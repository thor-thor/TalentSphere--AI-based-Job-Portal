const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiService = {
  parseResume: async (fileBuffer, filename) => {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fileBuffer, filename);

      const response = await axios.post(`${AI_SERVICE_URL}/parse_resume`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('AI Service Error (parse):', error.message);
      return null;
    }
  },

  matchJob: async (resumeText, jobDescription) => {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/match_job`, {
        resume_text: resumeText,
        job_description: jobDescription,
      });
      return response.data;
    } catch (error) {
      console.error('AI Service Error (match):', error.message);
      return { match_score: 0, matching_skills: [], missing_skills: [] };
    }
  },

  getRecommendations: async (userProfile, jobs) => {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/recommend_jobs`, {
        user_profile: userProfile,
        jobs: jobs,
      });
      return response.data.recommendations;
    } catch (error) {
      console.error('AI Service Error (recommendations):', error.message);
      return [];
    }
  },

  analyzeResume: async (resumeText) => {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/analyze_resume`, {
        resume_text: resumeText,
      });
      return response.data;
    } catch (error) {
      console.error('AI Service Error (analyze):', error.message);
      return { ats_score: 0, suggestions: [] };
    }
  },

  chat: async (userId, message) => {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
        user_id: userId,
        message: message,
      });
      return response.data;
    } catch (error) {
      console.error('AI Service Error (chat):', error.message);
      return { response: "I'm sorry, I'm having trouble connecting right now." };
    }
  }
};

module.exports = aiService;
