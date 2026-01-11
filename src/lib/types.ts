export type ResultType = "WIN" | "LOSS" | "BE";

export interface TradeLog {
  id: string | number;
  date: string;
  result: ResultType;
  note: string;
  dayOfWeek: string;
  durationMinutes: number;
  tvLink?: string; // 👈 KRİTİK: TypeScript hatasını çözen satır
}

export interface Edge {
  id: string;
  name: string;
  description: string;
  logs: TradeLog[];
}

export interface TradeLogInput {
  result: ResultType;
  note: string;
  dayOfWeek: string;
  durationMinutes: number;
  tvLink?: string;
}