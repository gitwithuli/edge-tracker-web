-- Add outcome column for WIN/LOSS tracking when edge occurs
-- Outcome is null when result is NO_SETUP, WIN or LOSS when OCCURRED

ALTER TABLE logs ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('WIN', 'LOSS') OR outcome IS NULL);

-- Create index for performance on outcome queries
CREATE INDEX IF NOT EXISTS idx_logs_outcome ON logs(outcome) WHERE outcome IS NOT NULL;
