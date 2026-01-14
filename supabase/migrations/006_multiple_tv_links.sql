-- Migration to support multiple TradingView links per log
-- Changes tv_link (TEXT) to tv_links (TEXT[])

-- Add new column for multiple links
ALTER TABLE logs ADD COLUMN IF NOT EXISTS tv_links TEXT[] DEFAULT '{}';

-- Migrate existing data from tv_link to tv_links
UPDATE logs
SET tv_links = ARRAY[tv_link]
WHERE tv_link IS NOT NULL AND tv_link != '' AND (tv_links IS NULL OR tv_links = '{}');

-- Note: Keeping tv_link column for backward compatibility
-- Can drop it later with: ALTER TABLE logs DROP COLUMN tv_link;
