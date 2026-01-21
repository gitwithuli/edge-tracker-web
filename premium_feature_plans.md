# Premium Feature Plans

## Pricing Tiers

### Overview

Three-tier structure designed to convert free users → paying subscribers through genuine value.

| Tier | Price | Target User |
|------|-------|-------------|
| **Retail** | $0 | Curious traders, testing the waters |
| **Trader** | $9/month | Serious about journaling, want persistence |
| **Inner Circle** | $29/month | Want AI automation, zero-friction journaling |

> **Naming rationale**: "Retail" is familiar trading terminology. "Trader" signals commitment. "Inner Circle" references ICT's brand and positions it as the elite tier.

---

### Retail Tier - $0/month

**Purpose**: Let traders experience the core value, create urgency through limitations.

| Feature | Limit |
|---------|-------|
| Edges | 1 edge only |
| Data retention | **30 days** (then auto-deleted) |
| Log entries | Unlimited (within 30-day window) |
| Analytics | Basic stats only |
| Export | ✓ CSV export (keep your data) |
| Macro Journal | ✗ |
| Backtest mode | ✗ |

**Conversion triggers**:
- "Your data will be deleted in 7 days. Upgrade to keep it."
- "Want to track multiple edges? Upgrade to Trader."
- After 30 days: "Your trading history was deleted. Upgrade to never lose data again."

---

### Trader Tier - $9/month (or $79/year)

**Purpose**: Full web app experience. For traders who want to journal properly.

| Feature | Access |
|---------|--------|
| Edges | **Unlimited** |
| Data retention | **Forever** |
| Log entries | Unlimited |
| Analytics | Full dashboard + charts |
| Export | CSV + JSON |
| Macro Journal | ✓ Full access |
| Backtest mode | ✓ Full access |
| Sub-edges | ✓ |
| Date range filters | ✓ |
| Dark mode | ✓ |

**What they DON'T get**:
- AI Screenshot Parser
- Voice Recording
- AI Summaries
- Mobile App
- Share Extension
- Live trade tracking (OPEN → WIN/LOSS)

**Pricing rationale**:
- $9/month is impulse-buy territory
- Cheaper than a single losing trade
- $79/year = 2 months free (encourages annual)

---

### Inner Circle Tier - $29/month (or $249/year)

**Purpose**: AI-powered trading journal. Zero friction. Maximum insights.

| Feature | Access |
|---------|--------|
| Everything in Trader | ✓ |
| **AI Screenshot Parser** | ✓ 100 parses/month |
| **Voice Recording** | ✓ Unlimited recordings |
| **AI Trade Analysis** | ✓ Emotion/reasoning extraction |
| **AI Summaries** | ✓ Daily/Weekly/Monthly/Quarterly/Yearly |
| **Mobile App** | ✓ iOS + Android |
| **Share Extension** | ✓ 3-tap journaling |
| **Live Trade Tracking** | ✓ OPEN → WIN/LOSS flow |
| Priority Support | ✓ |
| Early Access | ✓ New features first |

**Additional parse packs** (if 100/month exceeded):
- 50 extra parses: $5
- 200 extra parses: $15

**Pricing rationale**:
- $29/month = less than one ES point per day
- Serious traders spend more on indicators that don't work
- The AI features genuinely save 30+ minutes daily
- $249/year = 2 months free

---

### Pricing Comparison

| Competitor | Price | AI Features |
|------------|-------|-------------|
| Tradervue | $30-50/month | None |
| Edgewonk | $169 one-time | None |
| TraderSync | $30-80/month | Basic |
| **Edge of ICT Inner Circle** | **$29/month** | **Full AI suite** |

We're competitively priced with significantly more AI automation.

---

### Conversion Funnel

```
Retail User (testing)
    │
    ├─→ Hits 30-day limit → "Upgrade to keep data"
    │
    ├─→ Wants 2nd edge → "Upgrade to Trader"
    │
    └─→ Sees AI features → "Join the Inner Circle"

Trader User (paying $9)
    │
    ├─→ Tired of manual entry → "Try AI Parser"
    │
    ├─→ Wants mobile app → "Join the Inner Circle"
    │
    └─→ Wants summaries → "Join the Inner Circle"
```

---

### Implementation Notes

**Stripe Products**:
```
- edge_retail (price: $0)
- edge_trader_monthly (price: $9)
- edge_trader_yearly (price: $79)
- edge_inner_circle_monthly (price: $29)
- edge_inner_circle_yearly (price: $249)
```

**Database Schema Addition**:
```sql
-- User subscription status
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'retail';
-- 'retail' | 'trader' | 'inner_circle'

ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMP;
-- NULL for free, date for paid tiers

-- Track AI usage
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  month TEXT, -- '2026-01'
  parse_count INT DEFAULT 0,
  voice_minutes INT DEFAULT 0
);
```

**Middleware Checks**:
```typescript
// For Trader+ features
if (user.subscription_tier === 'retail') {
  redirect('/upgrade?feature=macro-journal');
}

// For Inner Circle features
if (user.subscription_tier !== 'inner_circle') {
  redirect('/upgrade?feature=ai-parser');
}
```

---

### Launch Strategy

**Phase 1: Soft Launch**
- Retail + Trader tiers only
- Build user base, gather feedback
- Inner Circle features in development

**Phase 2: Inner Circle Launch**
- Announce Inner Circle tier with AI features
- Early bird: $19/month for first 100 users (locked for life)
- Full price $29/month after

**Phase 3: Mobile Launch**
- iOS app release
- Share Extension as Inner Circle exclusive
- Push to convert Trader → Inner Circle

---

### Revenue Projections (Conservative)

| Users | Retail | Trader ($9) | Inner Circle ($29) | MRR |
|-------|--------|-------------|-------------------|-----|
| 100 | 70 | 25 | 5 | $370 |
| 500 | 350 | 120 | 30 | $1,950 |
| 1,000 | 700 | 220 | 80 | $4,300 |
| 5,000 | 3,500 | 1,100 | 400 | $21,500 |

At 5,000 users with 30% conversion: **$21,500 MRR** ($258K ARR)

---

## AI-Powered Trade Journal (Screenshot Parser)

### Overview
Automatically extract trade data from TradingView chart screenshots using AI vision. Zero manual data entry - upload a screenshot, get a complete journal entry.

---

### Core Capability

**Input**: TradingView chart screenshot with position tool (Long/Short setup)

**AI Extracts**:
| Data Point | Source on Chart |
|------------|-----------------|
| Symbol | Header (e.g., "E-mini Nasdaq-100 Futures") |
| Date & Time | Header timestamp (e.g., "Jan 19, 2026 17:08 UTC-5") |
| Timeframe | Header (e.g., "5" for 5-minute) |
| Direction | Position tool color/orientation (Long = profit zone above entry) |
| Entry Price | Position tool entry line |
| Stop Loss | Position tool SL line (with points/percentage) |
| Take Profit | Position tool TP line (with points/percentage) |
| Risk:Reward | Position tool R:R display |
| Outcome | AI analyzes which edge (TP or SL) price hit first |

---

### User Workflows

#### 1. Backtesting Mode (Single Screenshot)
For logging historical trades from chart review.

```
User uploads TradingView screenshot of completed trade
                    ↓
        AI Vision analyzes image
                    ↓
    Extracts: symbol, date, time, direction,
              entry, SL, TP, R:R
                    ↓
    Determines outcome: Which edge hit first?
    - TP hit first → WIN
    - SL hit first → LOSS
                    ↓
    Auto-creates complete log entry
```

**Use Case**: User reviewing charts, finding setups that occurred in the past, rapidly building backtest data.

#### 2. Live Trading Mode (Two Screenshots)

For tracking trades in real-time.

**Screenshot 1 - Trade Entry**:
```
User enters trade, takes screenshot
                ↓
      AI extracts setup data
                ↓
  Creates log with status: OPEN
  (Entry, SL, TP, R:R saved)
```

**Screenshot 2 - Trade Closed**:
```
Trade hits TP or SL, user takes screenshot
                    ↓
          AI analyzes chart
                    ↓
    Determines which edge was hit first
                    ↓
    Updates log: WIN or LOSS
    Calculates actual P&L
```

**Use Case**: Real-time trade journaling without interrupting trading flow.

---

### Technical Implementation

#### API Route
```
POST /api/parse-chart
```

**Request**:
```typescript
{
  imageUrl?: string;      // TradingView snapshot URL
  imageBase64?: string;   // Direct image upload
  edgeId: string;         // Which edge this trade belongs to
  existingLogId?: string; // For updating OPEN trades
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    symbol: string;
    date: string;           // YYYY-MM-DD
    time: string;           // HH:MM (NY time)
    timeframe: string;      // "5m", "15m", "1H", etc.
    direction: "LONG" | "SHORT";
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
    pointsRisked: number;
    pointsTarget: number;
    outcome: "WIN" | "LOSS" | "OPEN" | "UNCERTAIN";
    confidence: number;     // 0-1 AI confidence score
  };
  rawExtraction: string;    // For debugging
}
```

#### TradingView Link Handler
Convert snapshot links to direct image URLs:
```
Input:  https://www.tradingview.com/x/RbhFv3mG/
Output: https://s3.tradingview.com/snapshots/r/RbhFv3mG.png
```

#### Vision Model
- Model: Claude claude-sonnet-4-20250514 (vision)
- Cost: ~$0.003-0.01 per image
- Structured output via JSON response

---

### Constraints & Assumptions

| Constraint | Handling |
|------------|----------|
| TradingView only | Documented requirement, optimized prompts for TV UI |
| Timezone | Always NY time (UTC-5). User warned. ICT standard. |
| Symbol format | Kept as-is (supports old contract backtesting) |
| Position tool required | Error if no position tool detected |
| Outcome uncertain | If AI can't determine, status = "UNCERTAIN", user confirms |

---

### Access Control

- Feature restricted to Inner Circle users only
- Server-side route protection (middleware checks subscription)
- No per-request subscription check needed

---

### Cost Structure

| Tier | Monthly Allowance | Overage |
|------|-------------------|---------|
| Inner Circle | 100 parses/month | $0.05 per additional |

---

## Mobile App (iOS/Android)

### Overview
Native mobile app for Inner Circle members to capture and journal trades directly from their phone.

### Core Features

#### 1. Camera Capture
- Point phone at monitor showing TradingView chart
- App uses device camera to capture image
- Same AI parsing as web version

#### 2. Screenshot Import
- Import screenshots from photo library
- Useful for charts saved on mobile TradingView app

#### 3. Quick Entry
- Capture → Parse → Review → Save
- < 10 seconds from screenshot to logged trade

#### 4. Sync with Web
- All entries sync to main Edge of ICT account
- View full analytics on web dashboard
- Seamless data between platforms

### Technical Approach

| Option | Pros | Cons |
|--------|------|------|
| **React Native** | Shared codebase with web knowledge | Performance, app size |
| **Flutter** | Fast, beautiful UI | Different language (Dart) |
| **Native (Swift/Kotlin)** | Best performance | Two codebases |
| **PWA** | No app store, instant updates | Limited camera access, no store presence |

**Recommendation**: Start with **React Native** or **Expo** for fastest development with existing React/TypeScript skills.

### App Store Strategy

#### iOS App Store
- Apple Developer Program: $99/year
- App name: "Edge of ICT - Trade Journal"
- Category: Finance
- Inner Circle verification via App Store subscription OR existing web subscription

#### Google Play Store
- Google Play Developer: $25 one-time
- Same feature set as iOS

### Authentication Flow
```
App Launch
    ↓
Sign in with existing Edge of ICT account
(Google OAuth - same as web)
    ↓
Verify Inner Circle subscription
    ↓
Access camera/screenshot features
```

### iOS Share Sheet Integration

**The fastest possible journaling flow** - share directly from TradingView to Edge of ICT.

#### How It Works
```
User in TradingView app
         ↓
Takes screenshot or taps Share on chart
         ↓
iOS Share Sheet appears
         ↓
┌─────────────────────────────────────────┐
│  [AirDrop] [Messages] [WhatsApp] [Edge] │  ← Our app appears here
└─────────────────────────────────────────┘
         ↓
User taps "Edge of ICT" icon
         ↓
App receives image instantly
         ↓
AI parses chart → Creates log entry
         ↓
Quick confirmation → Done
```

#### Technical Implementation: iOS Share Extension

Share Extensions are app extensions that appear in the iOS share sheet.

**Required Components**:
```
EdgeOfICT.app/
├── EdgeOfICT (main app)
└── EdgeOfICTShare (Share Extension)
    ├── ShareViewController.swift
    ├── Info.plist (declares image support)
    └── MainInterface.storyboard
```

**Info.plist Configuration**:
```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionAttributes</key>
    <dict>
        <key>NSExtensionActivationRule</key>
        <dict>
            <key>NSExtensionActivationSupportsImageWithMaxCount</key>
            <integer>1</integer>
        </dict>
    </dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.share-services</string>
    <key>NSExtensionPrincipalClass</key>
    <string>ShareViewController</string>
</dict>
```

**Share Extension Flow**:
```swift
class ShareViewController: UIViewController {
    override func viewDidLoad() {
        // 1. Extract shared image
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachment = item.attachments?.first,
              attachment.hasItemConformingToTypeIdentifier(UTType.image.identifier) else {
            return
        }

        // 2. Load image data
        attachment.loadItem(forTypeIdentifier: UTType.image.identifier) { data, error in
            guard let imageData = data as? Data else { return }

            // 3. Send to API for parsing
            self.parseChart(imageData: imageData)
        }
    }

    func parseChart(imageData: Data) {
        // Call /api/parse-chart endpoint
        // Show quick preview of extracted data
        // User confirms → Log created
        // Dismiss extension
    }
}
```

#### User Experience

**First Time Setup**:
1. User downloads Edge of ICT app
2. Signs in with account
3. App automatically registers share extension
4. "Edge of ICT" appears in share sheet

**Daily Usage (3 taps total)**:
1. Screenshot chart in TradingView
2. Tap Share → Tap "Edge of ICT"
3. Review AI extraction → Tap Save

**Comparison**:
| Method | Steps | Time |
|--------|-------|------|
| Manual journal entry | 15+ taps | 2-3 min |
| Web upload | 8 taps | 45 sec |
| **Share Extension** | **3 taps** | **10 sec** |

#### Share Extension UI Options

**Option A: Minimal (Recommended)**
```
┌─────────────────────────────┐
│  ✓ Trade Captured           │
│                             │
│  NQ Long @ 21,450           │
│  SL: 21,426 | TP: 21,498    │
│  R:R 1:2.0                  │
│                             │
│  [Cancel]        [Save]     │
└─────────────────────────────┘
```

**Option B: Full Edit**
Opens main app with pre-filled form for detailed editing.

#### Android Equivalent

Android uses "Share Intents" - same concept, different implementation.

```kotlin
// AndroidManifest.xml
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
</intent-filter>
```

### Offline Capability
- Queue screenshots when offline
- Upload and parse when connection restored
- Local draft storage

---

## Implementation Roadmap

### Phase 1: Web Screenshot Parser (MVP)
- [ ] Create `/api/parse-chart` route
- [ ] Implement TradingView link → image URL conversion
- [ ] Build Claude vision integration with structured prompts
- [ ] Create upload UI in premium section
- [ ] Parse → Review → Save flow
- [ ] Handle OPEN trades (live trading mode)

### Phase 2: Refinement
- [ ] Improve extraction accuracy with prompt tuning
- [ ] Add confidence scores and uncertainty handling
- [ ] Batch upload support (multiple screenshots)
- [ ] Usage tracking and limits

### Phase 3: Mobile App
- [ ] Set up React Native / Expo project
- [ ] Implement camera capture
- [ ] Photo library import
- [ ] API integration (same endpoints as web)
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)

### Phase 4: Advanced Features
- [ ] Trade replay from multiple screenshots
- [ ] Auto-detect edge/setup type from chart patterns
- [ ] TradingView webhook integration (no screenshots needed)
- [ ] Share trades with chart image attached

---

## Revenue Impact

This feature addresses the #1 friction point in trade journaling: **manual data entry**.

| Competitor | Manual Entry Required |
|------------|----------------------|
| Tradervue | Yes |
| Edgewonk | Yes |
| TraderSync | Partial (broker import) |
| **Edge of ICT** | **No - AI extracts from screenshots** |

**Unique selling point**: "Journal your trades in 10 seconds. Just screenshot."

---

## Manual Editing

All AI-extracted data is **editable by the user**. The AI removes the hassle of creating entries and filling fields - user always has final control.

**Flow**:
```
Screenshot uploaded
       ↓
AI extracts all data
       ↓
User reviews pre-filled form
       ↓
Edit any field if needed
       ↓
Save entry
```

The value proposition: **AI handles 95% of the work, user validates and adjusts.**

---

## Voice Recording & AI Analysis

### Overview
Traders can voice record their thoughts and emotions **during** a trade. These recordings are saved with the trade entry and later analyzed by AI to provide psychological insights.

### Why This Matters
- Captures raw, unfiltered thoughts in the moment
- Impossible to journal in detail while actively trading
- Reveals emotional patterns correlated with outcomes
- Voice is faster than typing during high-pressure moments

### Recording Flow

**During Trade**:
```
User opens trade
       ↓
Taps "Record" on mobile app or web
       ↓
Speaks thoughts: "Entered long at 21450,
feeling confident, saw displacement off
the FVG, bit nervous about news in 30 min..."
       ↓
Recording saved with trade entry
```

**Post-Trade Analysis**:
```
AI transcribes recording
       ↓
Extracts key elements:
- Emotional state (confident, nervous, FOMO, patient)
- Reasoning (technical triggers mentioned)
- External factors (news, time of day)
       ↓
Generates summary card:
┌────────────────────────────────────┐
│ Trade #47 - NQ Long - WIN          │
├────────────────────────────────────┤
│ 🎯 Reasoning: FVG displacement     │
│ 😊 Emotion: Confident (7/10)       │
│ ⚠️  Concern: Upcoming news         │
│ 📝 "Nervous about news in 30 min"  │
└────────────────────────────────────┘
```

### AI Insights Over Time

After collecting multiple recordings, AI identifies patterns:

| Pattern | Insight |
|---------|---------|
| "Confident" + WIN rate | "You win 73% when you feel confident at entry" |
| "FOMO" + LOSS rate | "FOMO trades have 23% win rate - avoid" |
| Time correlation | "Your calmest recordings are during AM session" |
| Reasoning quality | "Trades with clear FVG reasoning: 68% WR vs 41% without" |

### Technical Implementation

- **Recording**: Browser MediaRecorder API / Native audio on mobile
- **Storage**: Audio files in Supabase Storage (or S3)
- **Transcription**: Whisper API or Claude audio input
- **Analysis**: Claude with structured psychological prompts
- **Cost**: ~$0.006/min transcription + $0.01-0.03 analysis

---

## AI Trading Summaries (Wrapped Style)

### The Problem
High-volume traders take 10s or 100s of trades daily. Impossible to:
- Journal each trade in detail
- Remember what happened last Tuesday
- See patterns across hundreds of trades
- Stay accountable without overwhelming effort

### The Solution
**AI-generated summaries delivered automatically** - like Spotify Wrapped, but for your trading.

### Summary Tiers

| Frequency | Delivery | Content |
|-----------|----------|---------|
| **Daily** | 6 PM ET (after market close) | Today's trades, P&L, emotional patterns |
| **Weekly** | Saturday 9 AM ET | Week review, best/worst days, streaks |
| **Monthly** | 1st of month | Month stats, edge performance, growth areas |
| **Quarterly** | End of Q1/Q2/Q3/Q4 | Seasonal patterns, major improvements |
| **Yearly** | December 31st | Full year wrapped, milestones, evolution |

### User Preferences

```
Summary Settings
─────────────────────────────────
☑ Daily Summary     [6:00 PM ET ▼]
☑ Weekly Summary    [Saturday ▼]
☑ Monthly Summary
☑ Quarterly Summary
☑ Yearly Summary

Delivery: [Email ▼] [Push Notification ▼]
```

**Default**: Weekly summaries enabled for all users (Saturday delivery)

### Summary Content

#### Daily Summary (High-Volume Traders)
```
┌─────────────────────────────────────────────┐
│  📊 DAILY SUMMARY - Friday, Jan 19          │
├─────────────────────────────────────────────┤
│                                             │
│  Trades: 23        Net P&L: +$1,247         │
│  Wins: 15 (65%)    Losses: 8                │
│                                             │
│  🏆 Best Trade: NQ Long +$312 (AM SB)       │
│  💀 Worst Trade: ES Short -$156             │
│                                             │
│  ⏰ Best Session: 9:30-11:00 AM (8W/2L)     │
│  📉 Avoid: Lunch hour (1W/4L)               │
│                                             │
│  🎯 Edge Performance                        │
│  ├─ Silver Bullet: 7W/3L (70%)              │
│  ├─ FVG Entries: 5W/2L (71%)                │
│  └─ IFVG: 3W/3L (50%) ⚠️                    │
│                                             │
│  🧠 Voice Recording Insight                 │
│  "You mentioned feeling rushed in 4 of      │
│   your losing trades today."                │
│                                             │
│  💡 Tomorrow's Focus                        │
│  "Skip lunch hour. Your AM edge is strong." │
│                                             │
└─────────────────────────────────────────────┘
```

#### Weekly Summary (Default for All Users)
```
┌─────────────────────────────────────────────┐
│  📊 WEEKLY WRAPPED - Week of Jan 13-17      │
├─────────────────────────────────────────────┤
│                                             │
│  Total Trades: 47     Net P&L: +$3,891      │
│  Win Rate: 62%        Avg R: 1.8            │
│                                             │
│  📈 Week Highlights                         │
│  ├─ Tuesday was your best day (+$1,420)     │
│  ├─ 3-trade win streak on Thursday AM       │
│  └─ Silver Bullet edge hit 78% this week    │
│                                             │
│  📉 Areas to Review                         │
│  ├─ Friday afternoon: 0W/3L                 │
│  └─ Revenge trades after losses detected    │
│                                             │
│  🎯 Best Performing Edge                    │
│  AM Silver Bullet: 12W/3L (80%) 🔥          │
│                                             │
│  😊 Emotional Patterns                      │
│  "Confidence correlated with wins (r=0.67)" │
│  "Patience mentioned in 8 of 10 wins"       │
│                                             │
│  🎯 Next Week Focus                         │
│  "Your Tuesday performance is elite.        │
│   Consider sizing up on Tuesdays."          │
│                                             │
└─────────────────────────────────────────────┘
```

#### Yearly Summary (December 31st)
```
┌─────────────────────────────────────────────┐
│  🎉 YOUR 2026 TRADING WRAPPED               │
├─────────────────────────────────────────────┤
│                                             │
│  Total Trades: 2,847                        │
│  Total P&L: +$47,293                        │
│  Best Month: September (+$8,420)            │
│                                             │
│  🏆 Your Trading Personality                │
│  "The Patient Sniper"                       │
│  You took fewer trades than average but     │
│  maintained 64% win rate all year.          │
│                                             │
│  📈 Year Highlights                         │
│  ├─ Win rate improved 12% from Q1 to Q4     │
│  ├─ Average R increased from 1.2 to 2.1     │
│  ├─ Longest win streak: 11 trades (March)   │
│  └─ You journaled 89% of trading days       │
│                                             │
│  🎯 Top Edge: AM Silver Bullet              │
│  847 trades | 71% WR | +$18,392             │
│                                             │
│  📅 Best Trading Day: Tuesday               │
│  612 trades | 68% WR | +$12,847             │
│                                             │
│  🧠 Psychological Growth                    │
│  "FOMO mentions decreased 67% from Q1"      │
│  "Patience mentions increased 3x"           │
│                                             │
│  💡 2027 Focus Areas                        │
│  1. Your lunch hour performance lags        │
│  2. Consider skipping Fridays (48% WR)      │
│  3. Size up on your A+ setups               │
│                                             │
└─────────────────────────────────────────────┘
```

### Delivery Methods

| Method | Implementation |
|--------|----------------|
| **Email** | SendGrid/Resend with HTML template |
| **Push Notification** | Mobile app + web push |
| **In-App** | Summary card on dashboard |
| **PDF Export** | Downloadable report |

### Technical Implementation

- **Scheduler**: Cron jobs (Vercel cron or external)
- **Generation**: Claude API with trading data context
- **Templates**: Pre-designed cards, AI fills content
- **Storage**: Generated summaries cached for viewing history

---

## Updated Implementation Roadmap

### Phase 1: Web Screenshot Parser (MVP)
- [ ] Create `/api/parse-chart` route
- [ ] TradingView link → image URL conversion
- [ ] Claude vision integration
- [ ] Upload UI in premium section
- [ ] Parse → Review → **Edit** → Save flow
- [ ] Handle OPEN trades (live trading mode)

### Phase 2: Voice Recording
- [ ] Audio recording component (web + mobile)
- [ ] Supabase storage for audio files
- [ ] Whisper transcription integration
- [ ] AI analysis pipeline
- [ ] Summary cards per trade

### Phase 3: AI Summaries
- [ ] Daily summary generation (opt-in)
- [ ] Weekly summary generation (default)
- [ ] Email delivery system
- [ ] In-app summary viewer
- [ ] Monthly/Quarterly templates

### Phase 4: Mobile App
- [ ] React Native / Expo setup
- [ ] Camera capture
- [ ] Voice recording on mobile
- [ ] Push notification summaries
- [ ] **iOS Share Extension** (appear in share sheet next to AirDrop)
- [ ] **Android Share Intent** (same for Android)
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)

### Phase 5: Advanced
- [ ] Yearly wrapped (December delivery)
- [ ] PDF export for all summaries
- [ ] Trading personality classification
- [ ] Pattern detection across time
- [ ] Social sharing of wrapped stats

---

## Open Questions

1. **Broker Integration**: Should we also support broker statement imports alongside screenshots?
2. **Multiple TPs**: Some traders use partial exits. Handle in V2?
3. **Chart Annotations**: Should we preserve/store the original screenshot with the log entry?
4. **Social Features**: Share winning trades with chart image to community?
5. **Voice Recording Privacy**: Local-only option for sensitive traders?
6. **Summary Sharing**: Allow users to share their Wrapped publicly?

---

*Last Updated: January 19, 2026*
