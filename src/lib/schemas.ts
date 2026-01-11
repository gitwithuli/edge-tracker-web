import { z } from "zod";
import { RESULT_TYPES, TRADING_DAYS } from "./constants";

export const tradeLogInputSchema = z.object({
  result: z.enum(RESULT_TYPES),
  dayOfWeek: z.enum(TRADING_DAYS),
  durationMinutes: z.number().int().min(1).max(1440),
  note: z.string().max(2000).default(""),
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

export const tradeLogSchema = tradeLogInputSchema.extend({
  id: z.union([z.string(), z.number()]),
  date: z.string(),
});

export type TradeLog = z.infer<typeof tradeLogSchema>;

export const edgeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  logs: z.array(tradeLogSchema).default([]),
});

export type Edge = z.infer<typeof edgeSchema>;

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
