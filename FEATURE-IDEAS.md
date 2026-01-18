# Feature Ideas

## TODO - Next Week

### 1. Better Duration Counter
- Current max is 1440 minutes (24 hours) - too restrictive for backtests/swing trades
- Backtests can span multiple days, swing trades can last weeks/months

**Decision: Option A - Unit selector**
```
Duration: [45] [days ▼]
         └─── dropdown: minutes | hours | days
```

**Files to modify:**
- `src/lib/schemas.ts:50` - Remove `.max(1440)` validation
- `src/components/log-dialog.tsx:515` - Remove `max="1440"`, add unit dropdown
- Store internally as minutes for backward compatibility

### 2. Add Major FX Pairs to Contract Selection
- EUR/USD
- GBP/USD
- USD/JPY
- USD/CHF
- AUD/USD
- USD/CAD
- NZD/USD
- EUR/GBP
- EUR/JPY
- GBP/JPY

---

## Screenshot Auto-Upload + "Trading Wrapped" Weekly Review

**Status**: Idea - to be implemented later

### The Problem
Traders take hundreds of screenshots weekly (665 in one user's Downloads folder). Manually organizing and linking them to trade logs is tedious. Lazy traders won't do it.

### The Solution
Auto-categorize screenshots and provide a "Spotify Wrapped" style weekly review.

### TradingView Naming Convention (Already Parsed!)
```
NQH2026_2026-01-15_10-30-45_abc123.png
└─symbol─┘ └──date──┘ └─time─┘
```

This gives us symbol, date, and time automatically from filenames.

### User's Screenshot Stats (Real Data)
- 665 total screenshots
- Top symbols: NQ (430), MNQ (55), DXY (44), YM (21), ES (18)
- Multiple symbols: futures, forex, crypto

### Storage Options

| Service | Pros | Cons |
|---------|------|------|
| Supabase Storage | Already integrated, 1GB free | Egress costs at scale |
| Cloudflare R2 | Zero egress fees, S3-compatible | Separate service |
| Vercel Blob | Easy integration | More expensive |

**Recommendation**: Start with Supabase Storage, migrate to R2 if costs grow.

### "Trading Wrapped" Weekly Review UI

```
┌─────────────────────────────────────────┐
│  YOUR WEEK IN REVIEW                    │
│                                         │
│  You captured 47 screenshots            │
│  across 5 symbols                       │
│                                         │
│  Most active: NQ (32 charts)            │
│  Peak hours: 9-11 AM EST                │
│  Best day: Tuesday (12 setups)          │
│                                         │
│  Top session: AM Silver Bullet          │
│  Win rate this week: 68%                │
│                                         │
│  [Swipe through your setups →]          │
└─────────────────────────────────────────┘
```

### Auto-Upload Flow

1. **Desktop app or browser extension** watches Downloads folder
2. **Detects new TradingView screenshots** (pattern: `SYMBOL_DATE_TIME_*.png`)
3. **Parses filename** → extracts symbol, date, time
4. **Uploads to storage** with metadata
5. **Auto-links to logs** for that symbol/date if exists
6. **Weekend trigger**: generates "wrapped" summary

### Technical Implementation Phases

**Phase 1: Manual Upload with Auto-Parse**
- Drag-drop zone in log dialog
- Parse filename for metadata
- Store in Supabase Storage

**Phase 2: Bulk Import**
- "Import Screenshots" button
- Select folder/multiple files
- Batch process and categorize

**Phase 3: Desktop Watcher (Electron/Tauri)**
- Background app watches folder
- Auto-upload on new screenshot
- Notification: "Screenshot logged to NQ - Jan 15"

**Phase 4: Weekly Wrapped**
- Automated weekly email/notification
- Interactive review page
- Shareable summary cards

### Why This Wins

> "I think all the lazy traders will flood to our service."

- Removes friction from journaling
- Makes review process enjoyable (gamification)
- Provides insights traders wouldn't calculate themselves
- Shareable = viral potential

### Reference: How Others Handle Images

- **Notion**: AWS S3 + CloudFront CDN
- **Figma**: Google Cloud Storage
- **Discord**: Google Cloud + custom CDN

Costs: ~$0.023/GB storage + $0.09/GB transfer (S3)

---

*Saved: 2026-01-17*
