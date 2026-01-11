-- Fix duration_minutes constraint to allow 0 for NO_SETUP logs
-- The constraint should allow 0-1440, not 1-1440

-- Drop the existing constraint
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_duration_minutes_check;

-- Add the corrected constraint that allows 0
ALTER TABLE logs ADD CONSTRAINT logs_duration_minutes_check
  CHECK (duration_minutes >= 0 AND duration_minutes <= 1440);
