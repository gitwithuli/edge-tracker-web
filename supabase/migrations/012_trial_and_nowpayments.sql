-- Migration: Add trial system and NOWPayments support
-- Extends user_subscriptions with trial tracking and crypto payment fields

-- 1. Update the CHECK constraint to allow new tier values
ALTER TABLE user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_subscription_tier_check;

ALTER TABLE user_subscriptions
  ADD CONSTRAINT user_subscriptions_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'free', 'paid', 'unpaid'));

-- 2. Add trial tracking columns
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Add payment provider columns (for NOWPayments and future providers)
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT NULL;

-- 4. Update the signup trigger to create trial subscriptions
CREATE OR REPLACE FUNCTION create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (
    user_id,
    subscription_tier,
    trial_started_at,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Migrate existing unpaid users to free tier
-- (Paid users stay as 'paid', only unpaid users move to 'free')
UPDATE user_subscriptions
SET subscription_tier = 'free'
WHERE subscription_tier = 'unpaid';

-- 6. Add index for payment lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_id
  ON user_subscriptions (payment_id)
  WHERE payment_id IS NOT NULL;
