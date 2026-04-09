-- Migration: Add AI features columns
ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';
ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS is_parsed BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS match_score DECIMAL(5,2) DEFAULT 0.0;

-- Migration: Add OAuth columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_provider_id);
