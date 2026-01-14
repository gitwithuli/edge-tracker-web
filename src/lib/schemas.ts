import { z } from "zod";
import { RESULT_TYPES, TRADING_DAYS, LOG_TYPES, OUTCOME_TYPES } from "./constants";

// Input schema for creating/updating logs (what the form submits)
export const tradeLogInputSchema = z.object({
  result: z.enum(RESULT_TYPES),
  outcome: z.enum(OUTCOME_TYPES).nullable().optional(),
  logType: z.enum(LOG_TYPES).default("FRONTTEST"),
  dayOfWeek: z.enum(TRADING_DAYS),
  durationMinutes: z.number().int().min(0).max(1440),
  note: z.string().max(2000).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
  tvLink: z
    .string()
    .url("Invalid TradingView URL")
    .refine(
      (url) => url === "" || url.includes("tradingview.com"),
      "URL must be from TradingView"
    )
    .optional()
    .or(z.literal("")),
});

export type TradeLogInput = z.infer<typeof tradeLogInputSchema>;

// Full trade log schema (includes DB fields)
export const tradeLogSchema = tradeLogInputSchema.extend({
  id: z.string(),
  edgeId: z.string(),
  date: z.string(),
  logType: z.enum(LOG_TYPES),
  outcome: z.enum(OUTCOME_TYPES).nullable(),
});

export type TradeLog = z.infer<typeof tradeLogSchema>;

// Input schema for creating/updating edges
export const edgeInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500).default(""),
});

export type EdgeInput = z.infer<typeof edgeInputSchema>;

// Full edge schema (without logs - logs are fetched separately)
export const edgeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
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
