export const RESULT_TYPES = ["OCCURRED", "NO_SETUP"] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const OUTCOME_TYPES = ["WIN", "LOSS"] as const;
export type OutcomeType = (typeof OUTCOME_TYPES)[number];

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
  tvLink: "",
  date: new Date().toISOString().split('T')[0],
} as const;

export const WIN_RATE_THRESHOLD = 50;

export const TRADINGVIEW_SNAPSHOT_BASE_URL = "https://s3.tradingview.com/snapshots";
