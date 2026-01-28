-- Add unique constraint on payment_id to prevent webhook replay attacks
-- and ensure idempotent payment processing.
-- Drop the existing non-unique index first, then add a unique one.

DROP INDEX IF EXISTS idx_user_subscriptions_payment_id;

CREATE UNIQUE INDEX idx_user_subscriptions_payment_id_unique
  ON user_subscriptions (payment_id)
  WHERE payment_id IS NOT NULL;
