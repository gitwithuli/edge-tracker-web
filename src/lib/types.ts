// Re-export types from schemas
export type { TradeLog, TradeLogInput, Edge, EdgeInput, EdgeWithLogs } from "./schemas";
export type { ResultType, TradingDay, LogType, OutcomeType, DirectionType } from "./constants";

// Subscription types
export type SubscriptionTier = 'unpaid' | 'paid';

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

// Feature access types
export type Feature =
  | 'forwardtest'
  | 'backtest'
  | 'macros'
  | 'unlimited_edges'
  | 'ai_parser'
  | 'voice_journal'
  | 'ai_summaries';

// Legacy export - prefer importing from constants directly
export { RESULT_TYPES as ResultTypes, LOG_TYPES as LogTypes } from "./constants";

// Macro tracking types
export type { MacroWindow, MacroDirection, DisplacementQuality, LiquiditySweep, MacroLogData } from "./macro-constants";
export type { MacroLog, MacroLogInput } from "@/hooks/use-macro-store";
