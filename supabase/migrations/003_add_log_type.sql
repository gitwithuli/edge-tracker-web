-- EdgeTracker V3 - Add log_type column and update result constraint
-- Run this after 002_alter_existing_tables.sql

-- Add log_type column to logs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logs' AND column_name = 'log_type'
  ) THEN
    ALTER TABLE logs ADD COLUMN log_type TEXT DEFAULT 'FRONTTEST';
  END IF;
END $$;

-- Update the result constraint to use new values (OCCURRED, NO_SETUP)
-- First drop the old constraint if it exists
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_result_check;

-- Add the new constraint
ALTER TABLE logs ADD CONSTRAINT logs_result_check
  CHECK (result IN ('OCCURRED', 'NO_SETUP'));

-- Add constraint for log_type values
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_log_type_check;
ALTER TABLE logs ADD CONSTRAINT logs_log_type_check
  CHECK (log_type IN ('FRONTTEST', 'BACKTEST'));

-- Ensure date column exists (should already exist from previous migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logs' AND column_name = 'date'
  ) THEN
    ALTER TABLE logs ADD COLUMN date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Create index on log_type for filtering
CREATE INDEX IF NOT EXISTS idx_logs_log_type ON logs(log_type);
