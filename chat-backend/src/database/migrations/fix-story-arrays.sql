-- Migration: Fix Story Array Columns
-- This migration converts customViewers and blockedViewers from simple-array (VARCHAR)
-- to proper PostgreSQL text[] arrays

-- Step 1: Backup existing data (optional, for safety)
-- CREATE TABLE stories_backup AS SELECT * FROM stories;

-- Step 2: Drop and recreate columns as proper arrays
-- If customViewers column exists as VARCHAR, drop it
ALTER TABLE stories DROP COLUMN IF EXISTS "customViewers";

-- Add customViewers as proper text array
ALTER TABLE stories ADD COLUMN "customViewers" text[] DEFAULT NULL;

-- If blockedViewers column exists as VARCHAR, drop it
ALTER TABLE stories DROP COLUMN IF EXISTS "blockedViewers";

-- Add blockedViewers as proper text array
ALTER TABLE stories ADD COLUMN "blockedViewers" text[] DEFAULT NULL;

-- Step 3: Comment for reference
COMMENT ON COLUMN stories."customViewers" IS 'User IDs who can view (for CUSTOM privacy) - PostgreSQL text array';
COMMENT ON COLUMN stories."blockedViewers" IS 'User IDs who cannot view - PostgreSQL text array';

-- Note: If you had existing data in these columns and need to preserve it,
-- you would need to parse the comma-separated values and convert them to arrays.
-- Since stories expire after 24 hours, old data is typically not critical.
