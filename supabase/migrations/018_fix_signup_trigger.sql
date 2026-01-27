-- Fix signup trigger: add exception handling so auth signup doesn't fail
-- if the subscription insert encounters any issue.
-- Also explicitly qualify the schema to avoid search_path issues.

CREATE OR REPLACE FUNCTION public.create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (
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
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_subscription_on_signup failed for user %: % (SQLSTATE %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly bound (re-create to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_subscription_on_signup();
