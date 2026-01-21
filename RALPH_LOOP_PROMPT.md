# Ralph Loop: Premium Features Implementation

## Mission
Implement the premium feature system for Edge of ICT including subscription tiers (Retail/Trader/Inner Circle), Stripe billing, and the AI Screenshot Parser for TradingView charts.

## Constraints
- **Maximum 3 iterations** - Aggressive prioritization required
- **Mock-first approach** - Build all logic without real API keys
- **Real APIs later** - User will add keys and test integrations after
- **Focus on working prototype** - Skip nice-to-haves, nail core flows

---

## Mock-First Development Strategy

All external API integrations should check for environment variables and return mock data when keys are missing:

```typescript
// Pattern for all API routes
if (!process.env.STRIPE_SECRET_KEY) {
  console.log('[MOCK] Stripe not configured, returning mock response');
  return Response.json({
    success: true,
    mock: true,
    data: { /* realistic mock data */ }
  });
}
// Real implementation when key exists
```

### Mock Responses to Implement

| Service | Mock Behavior |
|---------|---------------|
| **Stripe Checkout** | Return fake checkout URL, simulate success |
| **Stripe Webhook** | Accept test payloads, update DB as if real |
| **Claude Vision** | Return hardcoded parsed chart data |
| **Usage Tracking** | Real DB operations (no external API) |

---

## Iteration Plan (3 iterations - STRICT)

| Iteration | Scope | Key Deliverables |
|-----------|-------|------------------|
| **1** | Foundation + Billing | DB schema, types, Stripe mock routes, Pricing page complete |
| **2** | Access Control + Parser API | Tier restrictions, AI parser API route with mock, TradingView handler |
| **3** | Parser UI + Polish | Full upload → parse → save UI, security checks, end-to-end working |

### Iteration 1 Checklist
- [ ] Database migration (subscription fields)
- [ ] TypeScript types for subscriptions
- [ ] Mock Stripe checkout route
- [ ] Mock Stripe webhook route
- [ ] Pricing page UI (complete)
- [ ] Basic subscription hook update

### Iteration 2 Checklist
- [ ] Tier restriction middleware
- [ ] Retail limits (1 edge, no macro/backtest)
- [ ] Upgrade prompt component
- [ ] AI parser API route (mock response)
- [ ] TradingView URL → image handler
- [ ] Usage tracking table + logic

### Iteration 3 Checklist
- [ ] AI Journal page with upload UI
- [ ] Drag/drop + file picker + URL input
- [ ] Parsed result display (editable form)
- [ ] Save to journal flow
- [ ] Error handling
- [ ] Build passes, no TypeScript errors

---

## API Keys (for later - NOT required now)

| Service | Purpose | Environment Variable |
|---------|---------|---------------------|
| **Stripe** | Subscription billing | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Anthropic** | Claude Vision for chart parsing | `ANTHROPIC_API_KEY` |
| **Resend** (optional) | Email summaries | `RESEND_API_KEY` |

### Stripe Setup (user does later)
1. Create products in Stripe Dashboard
2. Enable Customer Portal
3. Set up webhook endpoint
4. Add keys to `.env.local`

---

## Implementation Phases

### Phase 0: Foundation Setup
**Branch**: `feature/subscription-foundation`

#### Step 0.1: Database Schema
- [ ] Read current Supabase schema structure
- [ ] Create migration for subscription fields:
  ```sql
  ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'retail';
  ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
  ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
  ```
- [ ] Create `ai_usage` table for tracking parse counts
- [ ] Create `parsed_charts` table for storing AI extractions
- [ ] Run migration, verify in Supabase dashboard
- [ ] **Checkpoint**: Query users table, confirm new columns exist

#### Step 0.2: Type Definitions
- [ ] Update `src/lib/types.ts` with subscription types:
  ```typescript
  type SubscriptionTier = 'retail' | 'trader' | 'inner_circle';
  interface UserSubscription {
    tier: SubscriptionTier;
    endsAt: string | null;
    stripeCustomerId: string | null;
  }
  ```
- [ ] Add `ParsedChartData` interface matching API response
- [ ] **Checkpoint**: TypeScript compiles without errors

#### Step 0.3: Environment Variables
- [ ] Add to `.env.local.example`:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- [ ] Update `next.config.js` if needed for env exposure
- [ ] **Checkpoint**: `console.log(process.env.STRIPE_SECRET_KEY)` works in API route

---

### Phase 1: Stripe Integration
**Branch**: `feature/stripe-billing`

#### Step 1.1: Stripe Client Setup
- [ ] Install Stripe: `npm install stripe @stripe/stripe-js`
- [ ] Create `src/lib/stripe.ts` with server-side Stripe client
- [ ] Create `src/lib/stripe-client.ts` for client-side (publishable key only)
- [ ] **Checkpoint**: Import Stripe in API route without errors

#### Step 1.2: Checkout API Route
- [ ] Create `src/app/api/checkout/route.ts`
- [ ] Accept `priceId` and `userId` in POST body
- [ ] Create or retrieve Stripe customer for user
- [ ] Create checkout session with:
  - `mode: 'subscription'`
  - `success_url: /dashboard?upgraded=true`
  - `cancel_url: /pricing`
  - `metadata: { userId, tier }`
- [ ] Return checkout URL
- [ ] **Checkpoint**: Calling API returns valid Stripe checkout URL

#### Step 1.3: Webhook Handler
- [ ] Create `src/app/api/webhooks/stripe/route.ts`
- [ ] Verify webhook signature using `stripe.webhooks.constructEvent`
- [ ] Handle events:
  - `checkout.session.completed` → Update user tier, save customer_id
  - `customer.subscription.updated` → Update tier if changed
  - `customer.subscription.deleted` → Downgrade to 'retail'
  - `invoice.payment_failed` → Log, maybe notify user
- [ ] Always return 200 to acknowledge receipt
- [ ] **Checkpoint**: Stripe webhook test event succeeds

#### Step 1.4: Customer Portal Route
- [ ] Create `src/app/api/billing/portal/route.ts`
- [ ] Create billing portal session for customer
- [ ] Return portal URL for redirect
- [ ] **Checkpoint**: User can access Stripe billing portal

#### Step 1.5: Pricing Page
- [ ] Create `src/app/pricing/page.tsx`
- [ ] Display three tiers: Retail (current), Trader ($9), Inner Circle ($29)
- [ ] Feature comparison table
- [ ] "Subscribe" buttons that call checkout API
- [ ] Handle loading states
- [ ] Match existing design system (cream/dark, Libre Baskerville)
- [ ] **Checkpoint**: Full pricing page renders, checkout buttons work

---

### Phase 2: Subscription Middleware & Access Control
**Branch**: `feature/subscription-access`

#### Step 2.1: Subscription Hook
- [ ] Update `src/hooks/use-edge-store.ts` to include subscription info
- [ ] Fetch user's `subscription_tier` and `subscription_ends_at`
- [ ] Add helper: `canAccess(feature: string): boolean`
- [ ] **Checkpoint**: `useEdgeStore()` returns subscription tier

#### Step 2.2: Tier Restrictions - Retail
- [ ] Add edge count limit (max 1 for retail)
- [ ] Show upgrade prompt when trying to create 2nd edge
- [ ] Add data retention warning (30-day limit - UI only for now)
- [ ] Block Macro Journal access for retail
- [ ] Block Backtest mode for retail
- [ ] **Checkpoint**: Retail user cannot create 2nd edge

#### Step 2.3: Tier Restrictions - Inner Circle Features
- [ ] Create placeholder route `src/app/ai-journal/page.tsx`
- [ ] Add middleware check: redirect non-inner-circle to /upgrade
- [ ] Create `/upgrade` page with feature comparison
- [ ] **Checkpoint**: Non-inner-circle user redirected from AI features

#### Step 2.4: Upgrade Prompts
- [ ] Create `src/components/upgrade-prompt.tsx` reusable component
- [ ] Show contextually when user hits tier limits
- [ ] "Upgrade to Trader" / "Join the Inner Circle" CTAs
- [ ] **Checkpoint**: Upgrade prompts appear at restriction points

---

### Phase 3: AI Screenshot Parser
**Branch**: `feature/ai-chart-parser`

#### Step 3.1: Anthropic Client Setup
- [ ] Install Anthropic SDK: `npm install @anthropic-ai/sdk`
- [ ] Create `src/lib/anthropic.ts` with client initialization
- [ ] **Checkpoint**: Anthropic client initializes without errors

#### Step 3.2: TradingView Image Handler
- [ ] Create `src/lib/tradingview.ts`
- [ ] Function to convert TV snapshot URL to direct image URL:
  ```typescript
  // https://www.tradingview.com/x/RbhFv3mG/
  // → https://s3.tradingview.com/snapshots/r/RbhFv3mG.png
  ```
- [ ] Function to fetch image as base64
- [ ] Handle errors (invalid URL, fetch failed)
- [ ] **Checkpoint**: Can fetch TV snapshot as base64

#### Step 3.3: Chart Parser API Route
- [ ] Create `src/app/api/parse-chart/route.ts`
- [ ] Accept: `imageUrl` OR `imageBase64`, `edgeId`, optional `existingLogId`
- [ ] Verify user is Inner Circle tier
- [ ] Check/increment monthly usage count
- [ ] If URL: convert to base64
- [ ] Call Claude Vision with structured prompt:
  ```
  Analyze this TradingView chart screenshot. Extract:
  1. Symbol (from header)
  2. Date and time (from header, format: YYYY-MM-DD HH:MM)
  3. Timeframe (from header)
  4. Direction (LONG or SHORT based on position tool)
  5. Entry price (from position tool)
  6. Stop loss price (from position tool)
  7. Take profit price (from position tool)
  8. Risk:Reward ratio
  9. Outcome (WIN if TP hit first, LOSS if SL hit first, OPEN if neither, UNCERTAIN if unclear)

  Return JSON only, no explanation.
  ```
- [ ] Parse Claude response as JSON
- [ ] Return structured `ParsedChartData`
- [ ] **Checkpoint**: API returns parsed data from test screenshot

#### Step 3.4: Parser Prompt Tuning
- [ ] Test with 5+ different chart screenshots
- [ ] Refine prompt for edge cases:
  - No position tool visible
  - Multiple position tools
  - Cropped header
  - Different symbol formats
- [ ] Add confidence score logic
- [ ] **Checkpoint**: 90%+ accuracy on test set

#### Step 3.5: Usage Tracking
- [ ] Create/update `ai_usage` table entry on each parse
- [ ] Check limit before parsing (100/month for Inner Circle)
- [ ] Return usage info in response: `{ remaining: 87, limit: 100 }`
- [ ] **Checkpoint**: Usage correctly tracked and limited

#### Step 3.6: Chart Parser UI
- [ ] Create `src/app/ai-journal/page.tsx` (full page for Inner Circle)
- [ ] Image upload component:
  - Drag & drop zone
  - File picker
  - Paste from clipboard
  - URL input for TV links
- [ ] Loading state during parsing
- [ ] Display parsed results in editable form
- [ ] Pre-select edge from dropdown
- [ ] "Save to Journal" button → creates log entry
- [ ] Show usage remaining
- [ ] **Checkpoint**: Full upload → parse → review → save flow works

#### Step 3.7: Live Trade Support
- [ ] Add "Trade Status" field: OPEN / CLOSED
- [ ] If OPEN: save log with `outcome: null`
- [ ] "Update Trade" flow: upload second screenshot
- [ ] Match to existing OPEN trade by edge + date
- [ ] Update outcome based on second screenshot
- [ ] **Checkpoint**: Can track OPEN trade and close it with second screenshot

---

### Phase 4: Security & Data Handling
**Branch**: `feature/security-hardening`

#### Step 4.1: API Route Protection
- [ ] All `/api/` routes verify authenticated user
- [ ] Subscription-gated routes verify tier
- [ ] Rate limiting on parse-chart (prevent abuse)
- [ ] **Checkpoint**: Unauthenticated requests return 401

#### Step 4.2: Input Validation
- [ ] Validate image size (max 10MB)
- [ ] Validate image type (PNG, JPG, WEBP only)
- [ ] Sanitize all user inputs
- [ ] Validate edgeId belongs to user
- [ ] **Checkpoint**: Invalid inputs rejected with clear errors

#### Step 4.3: Stripe Security
- [ ] Webhook signature verification (already done)
- [ ] Never expose secret key to client
- [ ] Validate checkout session belongs to user
- [ ] **Checkpoint**: Security audit passes

#### Step 4.4: Data Privacy
- [ ] Parsed chart images: store reference only, not full image (optional)
- [ ] Or: store in Supabase Storage with user-scoped access
- [ ] User can delete their parsed charts
- [ ] **Checkpoint**: User data properly scoped and deletable

---

### Phase 5: Testing & Polish
**Branch**: `feature/premium-polish`

#### Step 5.1: End-to-End Testing
- [ ] Test full flow: Sign up → Retail limits → Upgrade to Trader → Full access
- [ ] Test Trader → Inner Circle upgrade
- [ ] Test Inner Circle → Cancel → Downgrade to Retail
- [ ] Test AI parser with various charts
- [ ] Test edge cases and error states
- [ ] **Checkpoint**: All flows work without errors

#### Step 5.2: Error Handling
- [ ] Stripe checkout fails gracefully
- [ ] AI parsing fails gracefully (return error, don't crash)
- [ ] Network errors handled
- [ ] User-friendly error messages
- [ ] **Checkpoint**: No unhandled errors in any flow

#### Step 5.3: UI Polish
- [ ] Loading states everywhere
- [ ] Success toasts for upgrades
- [ ] Smooth animations
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] **Checkpoint**: UI feels polished and professional

#### Step 5.4: Documentation
- [ ] Update README with new features
- [ ] Document environment variables needed
- [ ] Document Stripe setup steps
- [ ] **Checkpoint**: New developer could set up from docs

---

## Completion Criteria

The implementation is complete when:

1. **Subscription System**
   - [ ] Users can upgrade from Retail → Trader → Inner Circle
   - [ ] Stripe billing works (test mode)
   - [ ] Webhook updates user tier correctly
   - [ ] Users can manage billing via portal

2. **Tier Restrictions**
   - [ ] Retail: 1 edge limit, no Macro Journal, no Backtest
   - [ ] Trader: Full web app access
   - [ ] Inner Circle: All features + AI parser

3. **AI Screenshot Parser**
   - [ ] Parses TradingView charts with 90%+ accuracy
   - [ ] Extracts: symbol, date, time, direction, entry, SL, TP, R:R, outcome
   - [ ] Usage tracking (100/month limit)
   - [ ] OPEN trade support

4. **Security**
   - [ ] All routes protected
   - [ ] Input validation
   - [ ] No secrets exposed

---

## File Structure (Expected)

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts          # Stripe checkout
│   │   ├── billing/portal/route.ts    # Stripe portal
│   │   ├── webhooks/stripe/route.ts   # Stripe webhooks
│   │   └── parse-chart/route.ts       # AI chart parser
│   ├── pricing/page.tsx               # Pricing page
│   ├── upgrade/page.tsx               # Upgrade prompts
│   └── ai-journal/page.tsx            # AI parser UI
├── components/
│   ├── upgrade-prompt.tsx
│   └── chart-parser/
│       ├── upload-zone.tsx
│       ├── parsed-result.tsx
│       └── index.ts
├── lib/
│   ├── stripe.ts                      # Server Stripe client
│   ├── stripe-client.ts               # Client Stripe (publishable)
│   ├── anthropic.ts                   # Anthropic client
│   └── tradingview.ts                 # TV URL handling
└── hooks/
    └── use-edge-store.ts              # Updated with subscription
```

---

## Git Workflow

1. Create feature branch from `main`
2. Implement phase
3. Test thoroughly
4. Commit with clear messages
5. Create PR (do not merge without user review)

---

## Notes for Claude

- Always run `npm run build` before considering a phase complete
- Run `npx tsc --noEmit` frequently to catch type errors
- Test in browser after each significant change
- Use existing design patterns from the codebase
- Match existing color palette: #FAF7F2, #0F0F0F, #C45A3B, #8B9A7D
- Use Libre Baskerville for headings
- Prefer editing existing files over creating new ones where sensible
- Keep security top of mind - never expose secrets

---

## Promise for Completion

When all phases are complete and verified:

<promise>PREMIUM FEATURES COMPLETE</promise>
