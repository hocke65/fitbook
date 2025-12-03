-- Migration: Add Entra ID columns to users table
-- Run this migration to enable Microsoft Entra ID authentication

-- Add entra_id column (unique identifier from Entra ID)
ALTER TABLE users ADD COLUMN IF NOT EXISTS entra_id VARCHAR(255) UNIQUE;

-- Add auth_provider column to track authentication method
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';

-- Make password_hash nullable for users who only use Entra ID
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for faster Entra ID lookups
CREATE INDEX IF NOT EXISTS idx_users_entra_id ON users(entra_id);

-- Update existing users to have 'local' as auth_provider
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;
