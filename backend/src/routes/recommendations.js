const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const aiService = require('../services/aiService');

router.get('/', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Fetch user profile
    const profileResult = await pool.query('SELECT * FROM job_seeker_profiles WHERE user_id = $1', [userId]);
    const profile = profileResult.rows[0];
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch active jobs
    const jobsResult = await pool.query(
      `SELECT j.*, c.name as company_name, c.logo_url as company_logo 
       FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       WHERE j.is_active = true AND j.is_approved = true 
       LIMIT 50`
    );
    const jobs = jobsResult.rows;

    // Call AI Service for recommendations
    const recommendations = await aiService.getRecommendations(profile, jobs);
    
    // Enrich recommendations with full job details
    const enrichedRecs = recommendations.map(rec => {
      const job = jobs.find(j => j.id === rec.job_id);
      return { ...job, match_score: rec.score };
    });

    res.json({ recommendations: enrichedRecs.slice(0, 10) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
