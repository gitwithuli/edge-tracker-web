-- Migration: Drop legacy tv_link column
-- The tv_link column was replaced by tv_links (array) in migration 006.
-- The mapper (mapLogFromDb) falls back to tv_link if tv_links is empty,
-- but all existing data should have been migrated to tv_links already.
-- Dropping this column removes dead schema and reduces row size.

-- Step 1: Migrate any remaining legacy tv_link data to tv_links
UPDATE logs
SET tv_links = ARRAY[tv_link]
WHERE tv_link IS NOT NULL
  AND tv_link != ''
  AND (tv_links IS NULL OR array_length(tv_links, 1) IS NULL);

-- Step 2: Drop the legacy column
ALTER TABLE logs DROP COLUMN IF EXISTS tv_link;
