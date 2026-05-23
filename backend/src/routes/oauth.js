const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const passport = require('passport');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const isGoogleConfigured = googleClientId && googleClientSecret && googleClientId.length > 0;
const isGithubConfigured = githubClientId && githubClientSecret && githubClientId.length > 0;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

let googleStrategyConfigured = false;
let githubStrategyConfigured = false;

if (isGoogleConfigured) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  googleStrategyConfigured = true;
  
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: `${process.env.API_URL || process.env.FRONTEND_URL || 'http://localhost:5000'}/api/auth/oauth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const email = profile.emails[0].value;
      const providerId = profile.id;
      const firstName = profile.name.givenName || 'Google';
      const lastName = profile.name.familyName || 'User';
      const avatar = profile.photos[0]?.value ? profile.photos[0].value.substring(0, 499) : null;

      let user = await client.query(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2',
        ['google', providerId]
      );

      if (user.rows.length === 0) {
        const existingUser = await client.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          await client.query(
            'UPDATE users SET oauth_provider = $1, oauth_provider_id = $2, profile_picture = $3 WHERE id = $4',
            ['google', providerId, avatar, existingUser.rows[0].id]
          );
          user = await client.query(
            'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2',
            ['google', providerId]
          );
        } else {
          const bcrypt = require('bcryptjs');
          const tempPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
          const result = await client.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, oauth_provider, oauth_provider_id, profile_picture, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [email, tempPassword, firstName, lastName, 'job_seeker', 'google', providerId, avatar, true]
          );
          
          await client.query(
            'INSERT INTO job_seeker_profiles (user_id) VALUES ($1)',
            [result.rows[0].id]
          );
          
          user = await client.query('SELECT * FROM users WHERE id = $1', [result.rows[0].id]);
        }
      }

      await client.query('COMMIT');
      return done(null, user.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      return done(error, null);
    } finally {
      client.release();
    }
  }));
}

if (isGithubConfigured) {
  const GitHubStrategy = require('passport-github2').Strategy;
  githubStrategyConfigured = true;
  
  passport.use(new GitHubStrategy({
    clientID: githubClientId,
    clientSecret: githubClientSecret,
    callbackURL: `${process.env.API_URL || process.env.FRONTEND_URL || 'http://localhost:5000'}/api/auth/oauth/github/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const email = profile.emails?.[0]?.value || `${profile.id}@github.local`;
      const providerId = profile.id;
      const firstName = profile.displayName?.split(' ')[0] || 'GitHub';
      const lastName = profile.displayName?.split(' ').slice(1).join(' ') || 'User';
      const avatar = profile.photos[0]?.value ? profile.photos[0].value.substring(0, 499) : null;

      let user = await client.query(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2',
        ['github', providerId]
      );

      if (user.rows.length === 0) {
        const existingUser = await client.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          await client.query(
            'UPDATE users SET oauth_provider = $1, oauth_provider_id = $2, profile_picture = $3 WHERE id = $4',
            ['github', providerId, avatar, existingUser.rows[0].id]
          );
          user = await client.query(
            'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2',
            ['github', providerId]
          );
        } else {
          const bcrypt = require('bcryptjs');
          const tempPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
          const result = await client.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, oauth_provider, oauth_provider_id, profile_picture, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [email, tempPassword, firstName, lastName, 'job_seeker', 'github', providerId, avatar, true]
          );
          
          await client.query(
            'INSERT INTO job_seeker_profiles (user_id) VALUES ($1)',
            [result.rows[0].id]
          );
          
          user = await client.query('SELECT * FROM users WHERE id = $1', [result.rows[0].id]);
        }
      }

      await client.query('COMMIT');
      return done(null, user.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      return done(error, null);
    } finally {
      client.release();
    }
  }));
}

router.get('/google', (req, res, next) => {
  if (!googleStrategyConfigured) {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleStrategyConfigured) {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { failureRedirect: `${clientUrl}/login?error=oauth_failed` })(req, res, next);
}, async (req, res) => {
  try {
    console.log('Google OAuth callback - user:', req.user);
    const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const redirectUrl = `${clientUrl}/oauth/callback?token=${token}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
});

router.get('/github', (req, res, next) => {
  if (!githubStrategyConfigured) {
    return res.redirect(`${clientUrl}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!githubStrategyConfigured) {
    return res.redirect(`${clientUrl}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { failureRedirect: `${clientUrl}/login?error=oauth_failed` })(req, res, next);
}, async (req, res) => {
  try {
    const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.redirect(`${clientUrl}/oauth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
});

module.exports = router;