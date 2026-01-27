export const RESULT_TYPES = ["OCCURRED", "NO_SETUP"] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const OUTCOME_TYPES = ["WIN", "LOSS"] as const;
export type OutcomeType = (typeof OUTCOME_TYPES)[number];

export const DIRECTION_TYPES = ["LONG", "SHORT"] as const;
export type DirectionType = (typeof DIRECTION_TYPES)[number];

export const LOG_TYPES = ["FRONTTEST", "BACKTEST"] as const;
export type LogType = (typeof LOG_TYPES)[number];

export const TRADING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday"
] as const;
export type TradingDay = (typeof TRADING_DAYS)[number];

export const DEFAULT_LOG_VALUES = {
  result: "OCCURRED" as ResultType,
  logType: "FRONTTEST" as LogType,
  dayOfWeek: "Tuesday" as TradingDay,
  durationMinutes: 15,
  note: "",
  tvLinks: [] as string[],
  date: new Date().toISOString().split('T')[0],
} as const;

export const WIN_RATE_THRESHOLD = 50;

export const TRADINGVIEW_SNAPSHOT_BASE_URL = "https://s3.tradingview.com/snapshots";

// Futures contracts with dollar per point multipliers
export const FUTURES_SYMBOLS = {
  // Mini contracts
  NQ: { name: "NQ (Nasdaq)", multiplier: 20, category: "mini" },
  ES: { name: "ES (S&P 500)", multiplier: 50, category: "mini" },
  YM: { name: "YM (Dow)", multiplier: 5, category: "mini" },
  GC: { name: "GC (Gold)", multiplier: 100, category: "mini" },
  SI: { name: "SI (Silver)", multiplier: 5000, category: "mini" },
  CL: { name: "CL (Crude Oil)", multiplier: 1000, category: "mini" },
  RB: { name: "RB (Gasoline)", multiplier: 42000, category: "mini" },
  // Micro contracts
  MNQ: { name: "MNQ (Micro Nasdaq)", multiplier: 2, category: "micro" },
  MES: { name: "MES (Micro S&P)", multiplier: 5, category: "micro" },
  MYM: { name: "MYM (Micro Dow)", multiplier: 0.5, category: "micro" },
  MGC: { name: "MGC (Micro Gold)", multiplier: 10, category: "micro" },
  SIL: { name: "SIL (Micro Silver)", multiplier: 500, category: "micro" },
  MCL: { name: "MCL (Micro Crude)", multiplier: 100, category: "micro" },
  MRB: { name: "MRB (Micro Gasoline)", multiplier: 4200, category: "micro" },
} as const;

export type FuturesSymbol = keyof typeof FUTURES_SYMBOLS;
export const FUTURES_SYMBOL_LIST = Object.keys(FUTURES_SYMBOLS) as [FuturesSymbol, ...FuturesSymbol[]];

// FX pairs - multiplier is $ per pip per standard lot (100k units)
export const FX_SYMBOLS = {
  EURUSD: { name: "EUR/USD", multiplier: 10, pipDecimals: 4 },
  GBPUSD: { name: "GBP/USD", multiplier: 10, pipDecimals: 4 },
  AUDUSD: { name: "AUD/USD", multiplier: 10, pipDecimals: 4 },
  NZDUSD: { name: "NZD/USD", multiplier: 10, pipDecimals: 4 },
  USDCAD: { name: "USD/CAD", multiplier: 10, pipDecimals: 4 },
} as const;

export type FxSymbol = keyof typeof FX_SYMBOLS;
export const FX_SYMBOL_LIST = Object.keys(FX_SYMBOLS) as FxSymbol[];

// Crypto - multiplier is $ per $ move per coin
export const CRYPTO_SYMBOLS = {
  BTCUSD: { name: "BTC/USD", multiplier: 1 },
  ETHUSD: { name: "ETH/USD", multiplier: 1 },
  SOLUSD: { name: "SOL/USD", multiplier: 1 },
} as const;

export type CryptoSymbol = keyof typeof CRYPTO_SYMBOLS;
export const CRYPTO_SYMBOL_LIST = Object.keys(CRYPTO_SYMBOLS) as CryptoSymbol[];

// Combined type for all tradeable symbols
export type TradingSymbol = FuturesSymbol | FxSymbol | CryptoSymbol;
export type AssetClass = 'futures' | 'fx' | 'crypto';

// Helper to get symbol info from any asset class
export function getSymbolInfo(symbol: string): { name: string; multiplier: number } | null {
  if (symbol in FUTURES_SYMBOLS) return FUTURES_SYMBOLS[symbol as FuturesSymbol];
  if (symbol in FX_SYMBOLS) return FX_SYMBOLS[symbol as FxSymbol];
  if (symbol in CRYPTO_SYMBOLS) return CRYPTO_SYMBOLS[symbol as CryptoSymbol];
  return null;
}
