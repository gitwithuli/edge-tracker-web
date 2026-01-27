-- Fix missing columns in user_subscriptions
-- These were defined in migration 010 but are not present in the live DB

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Ensure the signup trigger creates trial subscriptions (not unpaid)
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
