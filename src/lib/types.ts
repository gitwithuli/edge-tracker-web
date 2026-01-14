// Re-export types from schemas
export type { TradeLog, TradeLogInput, Edge, EdgeInput, EdgeWithLogs } from "./schemas";
export type { ResultType, TradingDay, LogType, OutcomeType } from "./constants";

// Legacy export - prefer importing from constants directly
export { RESULT_TYPES as ResultTypes, LOG_TYPES as LogTypes } from "./constants";

// Macro tracking types
export type { MacroWindow } from "./macro-constants";
export type MacroOutcome = import("./macro-constants").MacroOutcome;

export interface MacroLog {
  id: string;
  macroId: string;
  date: string;
  outcome: MacroOutcome;
  note: string;
  tvLinks: string[];
  createdAt?: string;
}

export interface MacroLogInput {
  outcome: MacroOutcome;
  note?: string;
  tvLinks?: string[];
}
