export const RESULT_TYPES = ["WIN", "LOSS", "BE"] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const TRADING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday"
] as const;
export type TradingDay = (typeof TRADING_DAYS)[number];

export const DEFAULT_LOG_VALUES = {
  result: "WIN" as ResultType,
  dayOfWeek: "Tuesday" as TradingDay,
  durationMinutes: 15,
  note: "",
  tvLink: "",
} as const;

export const WIN_RATE_THRESHOLD = 50;

export const TRADINGVIEW_SNAPSHOT_BASE_URL = "https://s3.tradingview.com/snapshots";
