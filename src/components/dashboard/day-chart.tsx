"use client";

import { useMemo } from "react";
import type { TradeLog } from "@/lib/types";
import { TRADING_DAYS } from "@/lib/constants";

interface DayChartProps {
  logs: TradeLog[];
}

interface DayStats {
  day: string;
  shortDay: string;
  occurrences: number;
  total: number;
  occurrenceRate: number;
}

export function DayChart({ logs }: DayChartProps) {
  const dayStats = useMemo(() => {
    const stats: DayStats[] = TRADING_DAYS.map(day => {
      const dayLogs = logs.filter(l => l.dayOfWeek === day);
      const occurrences = dayLogs.filter(l => l.result === "OCCURRED").length;
      const total = dayLogs.length;
      return {
        day,
        shortDay: day.slice(0, 3),
        occurrences,
        total,
        occurrenceRate: total > 0 ? Math.round((occurrences / total) * 100) : 0,
      };
    });

    const validStats = stats.filter(s => s.total > 0);
    const maxRate = Math.max(...validStats.map(s => s.occurrenceRate), 0);

    return { stats, maxRate };
  }, [logs]);

  const hasData = dayStats.stats.some(s => s.total > 0);

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#0F0F0F]/5">
      <div className="flex items-center gap-4 mb-6">
        <h3
          className="text-lg tracking-tight"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Occurrence by Day
        </h3>
        <div className="flex-1 h-px bg-[#0F0F0F]/10" />
      </div>

      {!hasData ? (
        <p className="text-[#0F0F0F]/40 text-sm py-8 text-center">
          No days logged yet. Start tracking to see patterns.
        </p>
      ) : (
        <div className="space-y-4">
          {dayStats.stats.map(({ day, shortDay, occurrences, total, occurrenceRate }) => {
            const isBest = total > 0 && occurrenceRate === dayStats.maxRate && occurrenceRate > 0;

            return (
              <div key={day} className="flex items-center gap-4">
                <span className="w-10 text-xs font-medium text-[#0F0F0F]/50 uppercase tracking-wider">
                  {shortDay}
                </span>
                <div className="flex-1 h-8 bg-[#0F0F0F]/5 rounded-lg overflow-hidden relative">
                  {total > 0 && (
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-lg ${
                        isBest ? "bg-[#8B9A7D]" : "bg-[#8B9A7D]/60"
                      }`}
                      style={{ width: `${Math.max(occurrenceRate, 2)}%` }}
                    />
                  )}
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-[#0F0F0F]/70">
                    {total > 0 ? `${occurrenceRate}%` : "—"}
                    {total > 0 && (
                      <span className="text-[#0F0F0F]/30 ml-1">
                        ({occurrences}/{total})
                      </span>
                    )}
                  </span>
                </div>
                {isBest && (
                  <span className="text-xs text-[#C45A3B] font-medium tracking-wider uppercase">
                    Peak
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
