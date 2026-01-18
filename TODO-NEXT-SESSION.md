# TODO for Next Session

## Priority: Futures Data Integration & ICT Dashboards

### Goal
Fetch real futures prices to power ICT-focused dashboards and alerts.

### Data Requirements by Feature

| Feature | Data Needed | Frequency |
|---------|-------------|-----------|
| NWOG (New Week Opening Gap) | Weekly open vs prev weekly close | Once/week |
| NDOG (New Day Opening Gap) | Daily open vs prev daily close | Once/day |
| REQHs/REQLs | Swing highs/lows on multiple TFs | Hourly/Daily |
| Session Opens (Asia/London/NY) | Price at specific times | 3x/day |
| Model Alerts | Real-time price | Streaming |

### Data Provider Options

**Free/Low-Cost:**
1. **Yahoo Finance** (yfinance)
   - ES=F, NQ=F, YM=F, etc.
   - 15-min delayed, daily OHLC is fine
   - No API key needed
   - Good for: NWOG, NDOG, daily levels

2. **Tradier** (Free tier)
   - Delayed futures data
   - REST API, easy to use
   - Good for: Daily calculations

3. **Twelve Data** ($8/mo starter)
   - Real-time for some instruments
   - Good API, WebSocket support
   - Good for: Alerts if budget allows

4. **Polygon.io** ($29/mo)
   - Stocks + Indices real-time
   - Futures on higher tiers
   - WebSocket streaming

**Workaround: Crypto Perpetuals (FREE real-time)**
- Binance: BTCUSDT, ETHUSDT perpetuals
- Highly correlated to risk-on sentiment
- Free WebSocket streaming
- Could offer as alternative/addition

### Proposed Dashboards

1. **Daily Levels Dashboard**
   - NDOG (gap from prev close to today open)
   - Previous day high/low/close
   - Midnight open (NY time)
   - 8:30 open, 9:30 open
   - Source: Yahoo Finance (free)

2. **Weekly Levels Dashboard**
   - NWOG (gap from prev week close to this week open)
   - Previous week high/low
   - Current week opening price
   - Source: Yahoo Finance (free)

3. **Liquidity Levels Dashboard**
   - REQHs/REQLs on Daily/4H/1H
   - Requires swing detection algorithm
   - Mark levels on a simple chart or list
   - Source: Yahoo Finance historical

4. **Alerts System (Future)**
   - Price approaching key level
   - NWOG fill alert
   - Session open alerts
   - Requires: WebSocket or polling
   - Source: Twelve Data or crypto perpetuals

### Implementation Phases

**Phase 1: Daily Levels (Free)**
- Integrate Yahoo Finance via yfinance or direct API
- Calculate NDOG at market open
- Store previous day OHLC
- Display on dashboard

**Phase 2: Weekly Levels (Free)**
- Calculate NWOG on Sunday/Monday open
- Store weekly OHLC
- Track weekly range

**Phase 3: REQHs/REQLs (Free)**
- Implement swing high/low detection
- Identify equal highs/lows within tolerance
- Display as list or simple visualization

**Phase 4: Alerts (Paid or Crypto)**
- WebSocket connection to data provider
- Alert when price nears levels
- Push notifications (web push or email)

### Technical Notes

```typescript
// Yahoo Finance endpoints (no API key)
// Daily data: https://query1.finance.yahoo.com/v8/finance/chart/ES=F?interval=1d&range=1mo
// Intraday: https://query1.finance.yahoo.com/v8/finance/chart/ES=F?interval=15m&range=5d

// Symbols
const FUTURES = {
  ES: 'ES=F',   // E-mini S&P 500
  NQ: 'NQ=F',   // E-mini Nasdaq
  YM: 'YM=F',   // E-mini Dow
  RTY: 'RTY=F', // E-mini Russell
  CL: 'CL=F',   // Crude Oil
  GC: 'GC=F',   // Gold
};
```

### Questions to Resolve
- [ ] Which futures symbols to support initially? (ES, NQ, YM?)
- [ ] Store historical data in Supabase or fetch on demand?
- [ ] Alert delivery method? (Browser push, email, in-app?)
- [ ] Show actual chart or just level list?

---

## Log Dialog - Stop Loss Tracking

### Goal
Replace the current Win/Loss + Long/Short toggles with Entry/Stop Loss/Exit price inputs when price tracking is enabled.

### Current Flow
1. User selects Long or Short
2. User enters Entry and Exit prices
3. System calculates Win/Loss from direction + prices

### Proposed Flow
1. User enters Entry, Stop Loss, and Exit prices
2. System infers:
   - **Direction**: SL < Entry = LONG, SL > Entry = SHORT
   - **Outcome**:
     - LONG: Exit > Entry = WIN, Exit ≤ Entry = LOSS
     - SHORT: Exit < Entry = WIN, Exit ≥ Entry = LOSS
   - **Risk (for future R-multiple)**: |Entry - SL|

### Value to Trader
- Track stop loss sizes per edge (smaller SL = potentially preferable edge)
- Calculate R-multiples: (Exit - Entry) / (Entry - SL)
- Analyze if stops are being placed too tight/loose
- Compare risk profiles across different edges

### UI Changes
- Remove Long/Short toggle when price tracking enabled
- Add Stop Loss input between Entry and Exit
- Show calculated direction indicator (inferred from SL placement)
- Consider showing R-multiple after entry

### Database Changes
- Add `stop_loss` column to logs table (DECIMAL)
- Migration: `ALTER TABLE logs ADD COLUMN stop_loss DECIMAL(10, 2);`

### Notes
- Keep Long/Short toggle for non-price-tracking edges (manual outcome entry)
- Edge case: What if SL = Entry? (Invalid, should validate)
