-- Migration 010: Subscription System and Edge Sharing
-- This migration adds:
-- 1. User subscriptions table with 'unpaid' | 'paid' tiers
-- 2. Edge sharing columns (is_public, public_slug)

-- =============================================
-- PART 1: USER SUBSCRIPTIONS
-- =============================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'unpaid' CHECK (subscription_tier IN ('unpaid', 'paid')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create subscription record on user signup
CREATE OR REPLACE FUNCTION create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, subscription_tier)
  VALUES (NEW.id, 'unpaid')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create subscription when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_signup();

-- =============================================
-- PART 2: EDGE SHARING
-- =============================================

-- Add sharing columns to edges table
ALTER TABLE edges ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS show_trades BOOLEAN DEFAULT TRUE;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS show_screenshots BOOLEAN DEFAULT TRUE;

-- Index for public slug lookups
CREATE INDEX IF NOT EXISTS idx_edges_public_slug ON edges(public_slug) WHERE public_slug IS NOT NULL;

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_edge_slug()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
  slug_exists BOOLEAN;
BEGIN
  IF NEW.is_public = TRUE AND NEW.public_slug IS NULL THEN
    LOOP
      new_slug := encode(gen_random_bytes(6), 'base64');
      new_slug := replace(replace(replace(new_slug, '/', '_'), '+', '-'), '=', '');
      SELECT EXISTS(SELECT 1 FROM edges WHERE public_slug = new_slug) INTO slug_exists;
      EXIT WHEN NOT slug_exists;
    END LOOP;
    NEW.public_slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug when edge is made public
DROP TRIGGER IF EXISTS generate_edge_slug_trigger ON edges;
CREATE TRIGGER generate_edge_slug_trigger
  BEFORE INSERT OR UPDATE ON edges
  FOR EACH ROW
  EXECUTE FUNCTION generate_edge_slug();

-- RLS Policy for public edges (anyone can view public edges)
CREATE POLICY "Anyone can view public edges"
  ON edges FOR SELECT
  USING (is_public = TRUE);

-- RLS Policy for public logs (anyone can view logs of public edges if show_trades is true)
CREATE POLICY "Anyone can view logs of public edges"
  ON logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM edges
      WHERE edges.id = logs.edge_id
      AND edges.is_public = TRUE
      AND edges.show_trades = TRUE
    )
  );
