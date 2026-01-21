// Re-export types from schemas
export type { TradeLog, TradeLogInput, Edge, EdgeInput, EdgeWithLogs } from "./schemas";
export type { ResultType, TradingDay, LogType, OutcomeType, DirectionType } from "./constants";

// Legacy export - prefer importing from constants directly
export { RESULT_TYPES as ResultTypes, LOG_TYPES as LogTypes } from "./constants";

// Macro tracking types
export type { MacroWindow, MacroDirection, DisplacementQuality, LiquiditySweep, MacroLogData } from "./macro-constants";
export type { MacroLog, MacroLogInput } from "@/hooks/use-macro-store";

// Subscription types
export type SubscriptionTier = 'retail' | 'trader' | 'inner_circle';

export interface UserSubscription {
  tier: SubscriptionTier;
  endsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  highlighted?: boolean;
}

// AI Chart Parser types
export interface ParsedChartData {
  symbol: string;
  date: string;
  time: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  pointsRisked: number;
  pointsTarget: number;
  outcome: 'WIN' | 'LOSS' | 'OPEN' | 'UNCERTAIN';
  confidence: number;
}

export interface ChartParseResponse {
  success: boolean;
  mock?: boolean;
  data?: ParsedChartData;
  error?: string;
  usage?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface AIUsage {
  id: string;
  userId: string;
  month: string;
  parseCount: number;
  voiceMinutes: number;
}
