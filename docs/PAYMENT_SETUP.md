# Payment Setup Guide

## Current State (as of 2026-01-24)

Payment processing is implemented with **Stripe** in test mode. The system is ready to switch to either:
1. Stripe production mode
2. LemonSqueezy (pending verification)

---

## Environment Variables

### Stripe Test Mode (Current)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_... (test price)
STRIPE_PROMO_PRICE_ID=price_... (test promo price)
STRIPE_WEBHOOK_SECRET=whsec_... (from `stripe listen` CLI)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Stripe Production Mode
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_... (live price - $29/month)
STRIPE_PROMO_PRICE_ID=price_... (live promo price - $14.50/month)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard webhook config)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://edgeofict.com
```

### To Get Live Stripe Keys:
1. Stripe Dashboard → Developers → API Keys
2. Toggle OFF "Test mode"
3. Copy the live keys

### To Set Up Live Webhook:
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://edgeofict.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Switching to LemonSqueezy

When LemonSqueezy verification is complete:

### 1. New Environment Variables
```env
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_PRODUCT_ID=...
LEMONSQUEEZY_VARIANT_ID=... (price variant)
LEMONSQUEEZY_PROMO_VARIANT_ID=... (promo price variant)
LEMONSQUEEZY_WEBHOOK_SECRET=...
```

### 2. Files to Modify

**`src/app/api/checkout/route.ts`**
- Replace Stripe SDK with LemonSqueezy SDK
- Update checkout session creation logic
- LemonSqueezy uses different API structure

**`src/app/api/webhooks/stripe/route.ts`**
- Rename to `src/app/api/webhooks/lemonsqueezy/route.ts`
- Update webhook signature verification
- Update event type handling:
  - `order_created` → equivalent to `checkout.session.completed`
  - `subscription_updated` → equivalent to `customer.subscription.updated`
  - `subscription_cancelled` → equivalent to `customer.subscription.deleted`

### 3. Database Changes
The `user_subscriptions` table has Stripe-specific columns:
- `stripe_customer_id`
- `stripe_subscription_id`

Add LemonSqueezy equivalents:
```sql
ALTER TABLE user_subscriptions
ADD COLUMN lemonsqueezy_customer_id TEXT,
ADD COLUMN lemonsqueezy_subscription_id TEXT;
```

---

## Files Modified Today (2026-01-24)

### Subscription Paywall
- **`middleware.ts`** - Added admin client for subscription check (bypasses RLS)
- **`src/app/auth/callback/route.ts`** - Check subscription after OAuth, redirect unpaid to /pricing

### Edge Deletion
- **`src/hooks/use-edge-store.ts`** - `deleteEdge` now removes sub-edges from local state
- **`supabase/migrations/011_cascade_delete_sub_edges.sql`** - CASCADE delete for sub-edges

### UI Fixes
- **`src/app/login/page.tsx`** - Added dark mode variables for Supabase Auth UI
- **`next.config.ts`** - Added `allowedDevOrigins` for local network testing

---

## Testing Checklist

### Before Going Live:
- [ ] Switch to live Stripe keys (or LemonSqueezy)
- [ ] Set up production webhook endpoint
- [ ] Update `NEXT_PUBLIC_APP_URL` to `https://edgeofict.com`
- [ ] Run cascade delete migration on production Supabase
- [ ] Test full payment flow with real card
- [ ] Verify webhook receives events
- [ ] Test subscription status updates in database

### Test Payment Flow:
1. New user signs up → redirected to /pricing
2. Click Subscribe → Stripe/LS checkout
3. Complete payment → webhook fires
4. User redirected to /dashboard with `?upgraded=true`
5. Verify `user_subscriptions.subscription_tier = 'paid'`

---

## Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

Use any future expiry date and any 3-digit CVC.

---

## Rollback Plan

If payment issues occur in production:

1. **Temporarily disable paywall:**
   In `middleware.ts`, comment out the subscription check block (lines 104-129)

2. **Or allow all users:**
   Change line 118 from:
   ```ts
   if (!subscription || subscription.subscription_tier !== 'paid')
   ```
   to:
   ```ts
   if (false)
   ```

3. **Investigate and fix**, then revert the temporary change.
