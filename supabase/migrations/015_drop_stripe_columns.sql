-- Drop Stripe-specific columns from user_subscriptions
-- Stripe is no longer used; payments are handled via NOWPayments (crypto)
-- Card payments will be added later via LemonSqueezy

ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;

-- Drop the waitlist table (no longer needed for launch)
DROP TABLE IF EXISTS waitlist;
