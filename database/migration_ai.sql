-- Migration: Add AI features columns
ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';
ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS is_parsed BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS match_score DECIMAL(5,2) DEFAULT 0.0;
