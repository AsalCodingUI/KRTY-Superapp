-- Cleanup OAuth Implementation
-- Run this in Supabase SQL Editor to remove oauth_tokens table

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can delete own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can insert own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can update own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can view own OAuth tokens" ON oauth_tokens;

-- Drop trigger
DROP TRIGGER IF EXISTS oauth_tokens_updated_at ON oauth_tokens;

-- Drop function
DROP FUNCTION IF EXISTS update_oauth_tokens_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_oauth_tokens_user_id;
DROP INDEX IF EXISTS idx_oauth_tokens_provider;
DROP INDEX IF EXISTS idx_oauth_tokens_expires_at;

-- Drop table
DROP TABLE IF EXISTS oauth_tokens;
