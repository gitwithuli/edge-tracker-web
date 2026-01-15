import { z } from "zod";
import { RESULT_TYPES, TRADING_DAYS, LOG_TYPES, OUTCOME_TYPES, DIRECTION_TYPES, FUTURES_SYMBOL_LIST } from "./constants";

// Optional field groups that can be enabled per edge
export const OPTIONAL_FIELD_GROUPS = [
  'entryExitPrices',   // entryPrice, exitPrice
  'entryExitTimes',    // entryTime, exitTime
  'dailyOHLC',         // dailyOpen, dailyHigh, dailyLow, dailyClose
  'positionSize',      // positionSize
] as const;

export type OptionalFieldGroup = typeof OPTIONAL_FIELD_GROUPS[number];

// Field group metadata for UI display
export const FIELD_GROUP_INFO: Record<OptionalFieldGroup, { label: string; description: string }> = {
  entryExitPrices: {
    label: 'Entry/Exit Prices',
    description: 'Track entry and exit prices for P&L calculation',
  },
  entryExitTimes: {
    label: 'Entry/Exit Times',
    description: 'Track time of entry and exit during the day',
  },
  dailyOHLC: {
    label: 'Daily OHLC',
    description: 'Track daily Open, High, Low, Close prices',
  },
  positionSize: {
    label: 'Position Size',
    description: 'Track lot or contract size',
  },
};

// Schema for validating a single TradingView URL
const tvLinkSchema = z
  .string()
  .url("Invalid TradingView URL")
  .refine(
    (url) => url === "" || url.includes("tradingview.com"),
    "URL must be from TradingView"
  );

// Input schema for creating/updating logs (what the form submits)
export const tradeLogInputSchema = z.object({
  result: z.enum(RESULT_TYPES),
  outcome: z.enum(OUTCOME_TYPES).nullable().optional(),
  direction: z.enum(DIRECTION_TYPES).nullable().optional(),
  logType: z.enum(LOG_TYPES).default("FRONTTEST"),
  dayOfWeek: z.enum(TRADING_DAYS),
  durationMinutes: z.number().int().min(0).max(1440),
  note: z.string().max(2000).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
  tvLinks: z.array(tvLinkSchema).default([]),
  // Legacy field for backward compatibility
  tvLink: tvLinkSchema.optional().or(z.literal("")),
  // Optional fields (enabled per edge)
  entryPrice: z.number().nullable().optional(),
  exitPrice: z.number().nullable().optional(),
  entryTime: z.string().nullable().optional(), // HH:MM format
  exitTime: z.string().nullable().optional(),  // HH:MM format
  dailyOpen: z.number().nullable().optional(),
  dailyHigh: z.number().nullable().optional(),
  dailyLow: z.number().nullable().optional(),
  dailyClose: z.number().nullable().optional(),
  nyOpen: z.number().nullable().optional(),
  positionSize: z.number().nullable().optional(),
  symbol: z.string().nullable().optional(), // Futures symbol for dollar P&L
});

export type TradeLogInput = z.infer<typeof tradeLogInputSchema>;

// Full trade log schema (includes DB fields)
export const tradeLogSchema = tradeLogInputSchema.extend({
  id: z.string(),
  edgeId: z.string(),
  date: z.string(),
  logType: z.enum(LOG_TYPES),
  outcome: z.enum(OUTCOME_TYPES).nullable(),
  direction: z.enum(DIRECTION_TYPES).nullable(),
  tvLinks: z.array(z.string()).default([]),
  // Optional fields with explicit nullable types
  entryPrice: z.number().nullable(),
  exitPrice: z.number().nullable(),
  entryTime: z.string().nullable(),
  exitTime: z.string().nullable(),
  dailyOpen: z.number().nullable(),
  dailyHigh: z.number().nullable(),
  dailyLow: z.number().nullable(),
  dailyClose: z.number().nullable(),
  nyOpen: z.number().nullable(),
  positionSize: z.number().nullable(),
  symbol: z.string().nullable(),
});

export type TradeLog = z.infer<typeof tradeLogSchema>;

// Input schema for creating/updating edges
export const edgeInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500).default(""),
  enabledFields: z.array(z.enum(OPTIONAL_FIELD_GROUPS)).default([]),
  symbol: z.enum(FUTURES_SYMBOL_LIST as unknown as [string, ...string[]]).nullable().optional(),
});

export type EdgeInput = z.infer<typeof edgeInputSchema>;

// Full edge schema (without logs - logs are fetched separately)
export const edgeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  enabledFields: z.array(z.enum(OPTIONAL_FIELD_GROUPS)).default([]),
  symbol: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Edge = z.infer<typeof edgeSchema>;

// Edge with computed logs (for display)
export type EdgeWithLogs = Edge & {
  logs: TradeLog[];
};

export function validateTradeLogInput(data: unknown): TradeLogInput {
  return tradeLogInputSchema.parse(data);
}

export function safeValidateTradeLogInput(data: unknown): {
  success: boolean;
  data?: TradeLogInput;
  error?: string;
} {
  const result = tradeLogInputSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((e) => e.message).join(", "),
  };
}
