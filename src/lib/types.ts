export type ResultType = "WIN" | "LOSS" | "BE";

export interface TradeLog {
  id: string;
  date: string; // ISO string
  result: ResultType;
  note: string;
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  durationMinutes: number;
}

export interface Edge {
  id: string;
  name: string;
  description: string;
  logs: TradeLog[];
}