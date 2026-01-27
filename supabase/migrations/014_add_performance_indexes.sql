-- ============================================
-- Migration 014: Add performance indexes
-- ============================================
-- Adds indexes on frequently queried columns
-- to improve query performance at scale.

-- Logs table: date-based queries (calendar, stats, filtering)
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- Logs table: composite index for win rate / stats calculations
CREATE INDEX IF NOT EXISTS idx_logs_user_result_outcome ON logs(user_id, result, outcome);

-- Macro logs table: time-series queries
CREATE INDEX IF NOT EXISTS idx_macro_logs_created_at ON macro_logs(created_at DESC);

-- Subscriptions table: tier lookups (middleware, feature gating)
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON user_subscriptions(subscription_tier);

-- Edges table: GIN index for array column queries
CREATE INDEX IF NOT EXISTS idx_edges_enabled_fields ON edges USING GIN(enabled_fields);

-- Add CHECK constraint on payment_status to prevent invalid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_status_check'
  ) THEN
    ALTER TABLE user_subscriptions
      ADD CONSTRAINT payment_status_check
      CHECK (payment_status IS NULL OR payment_status IN ('waiting', 'confirmed', 'finished', 'failed', 'canceled', 'expired'));
  END IF;
END $$;
