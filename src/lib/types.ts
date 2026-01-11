// Re-export types from schemas for backwards compatibility
export type { TradeLog, TradeLogInput, Edge } from "./schemas";
export type { ResultType, TradingDay } from "./constants";

// Legacy export - prefer importing from constants directly
export { RESULT_TYPES as ResultTypes } from "./constants";
