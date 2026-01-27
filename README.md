# Edge Tracker Web

A trading edge journaling and analysis platform built with Next.js 16 and Supabase.

## Features

- **Edge Management**: Create and organize trading edges with parent-child hierarchies
- **Trade Logging**: Log trades with results, outcomes, and notes
- **Macro Analysis**: Track macro time windows and their performance
- **Backtest & Fronttest**: Separate logging for backtesting and live trading
- **Statistics Dashboard**: View win rates, occurrence rates, and performance metrics
- **Subscription Tiers**: Free tier with limits, Pro tier with unlimited access

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: NOWPayments (crypto)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Validation**: Zod
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/edge-tracker-web.git
cd edge-tracker-web
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages
│   ├── (protected)/       # Protected routes (dashboard, edges)
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
│   ├── use-edge-store.ts # Edge & auth state management
│   └── use-macro-store.ts # Macro logging state
├── lib/                  # Utilities and constants
│   ├── schemas.ts        # Zod validation schemas
│   ├── macro-constants.ts # Macro time windows
│   └── utils.ts          # Helper functions
└── test/                 # Test setup and utilities
```

## Testing

Run the test suite:

```bash
# Watch mode
npm run test

# Single run
npm run test:run

# With coverage
npm run test:coverage
```

Tests are located alongside source files with `.test.ts` suffix.

## Environment Variables

See `.env.example` for all required and optional environment variables.

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NOWPAYMENTS_API_KEY` - NOWPayments API key (for crypto payments)
- `NOWPAYMENTS_IPN_SECRET` - NOWPayments IPN webhook secret

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

The app includes a GitHub Actions CI pipeline that runs on every push and PR to main:
- TypeScript type checking
- ESLint
- Test suite
- Production build verification

## License

Private project - All rights reserved.
