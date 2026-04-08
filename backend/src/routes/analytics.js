const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

// Get recruiter-specific analytics
router.get('/recruiter', auth, authorize('recruiter'), async (req, res, next) => {
  try {
    const recruiterId = req.user.id;

    // 1. Applications over last 14 days
    const appTrendQuery = `
      SELECT DATE(a.applied_at) as date, COUNT(*) as count
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = $1 AND a.applied_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(a.applied_at)
      ORDER BY date ASC
    `;

    // 2. Job performance (views vs applications)
    const jobPerformanceQuery = `
      SELECT j.title, j.views_count, COUNT(a.id) as app_count
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.recruiter_id = $1
      GROUP BY j.id, j.title, j.views_count
      ORDER BY j.views_count DESC
      LIMIT 5
    `;

    // 3. Status distribution for all applications to recruiter's jobs
    const statusDistQuery = `
      SELECT a.status, COUNT(*) as count
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = $1
      GROUP BY a.status
    `;

    const [appTrend, jobPerformance, statusDist] = await Promise.all([
      pool.query(appTrendQuery, [recruiterId]),
      pool.query(jobPerformanceQuery, [recruiterId]),
      pool.query(statusDistQuery, [recruiterId])
    ]);

    res.json({
      appTrend: appTrend.rows,
      jobPerformance: jobPerformance.rows,
      statusDist: statusDist.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get seeker-specific analytics
router.get('/seeker', auth, authorize('job_seeker'), async (req, res, next) => {
  try {
    const seekerId = req.user.id;

    // 1. Applications by status
    const statusDistQuery = `
      SELECT status, COUNT(*) as count
      FROM applications
      WHERE applicant_id = $1
      GROUP BY status
    `;

    // 2. Application trend
    const appTrendQuery = `
      SELECT DATE(applied_at) as date, COUNT(*) as count
      FROM applications
      WHERE applicant_id = $1 AND applied_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(applied_at)
      ORDER BY date ASC
    `;

    const [statusDist, appTrend] = await Promise.all([
      pool.query(statusDistQuery, [seekerId]),
      pool.query(appTrendQuery, [seekerId])
    ]);

    res.json({
      statusDist: statusDist.rows,
      appTrend: appTrend.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
