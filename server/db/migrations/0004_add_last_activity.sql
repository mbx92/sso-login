-- Add last_activity_at column to users table for online status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS users_last_activity_idx ON users(last_activity_at);
