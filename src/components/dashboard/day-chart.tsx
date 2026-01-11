"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
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

    // Find best day for highlighting
    const validStats = stats.filter(s => s.total > 0);
    const maxRate = Math.max(...validStats.map(s => s.occurrenceRate), 0);

    return { stats, maxRate };
  }, [logs]);

  const hasData = dayStats.stats.some(s => s.total > 0);

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          OCCURRENCE BY DAY
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-zinc-600 text-sm italic py-4">
            No days logged yet. Start tracking to see patterns.
          </p>
        ) : (
          <div className="space-y-3">
            {dayStats.stats.map(({ day, shortDay, occurrences, total, occurrenceRate }) => {
              const isBest = total > 0 && occurrenceRate === dayStats.maxRate && occurrenceRate > 0;

              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-medium text-zinc-500">
                    {shortDay}
                  </span>
                  <div className="flex-1 h-6 bg-zinc-900 rounded overflow-hidden relative">
                    {total > 0 && (
                      <div
                        className={`h-full transition-all duration-500 ${
                          isBest ? "bg-emerald-500" : "bg-emerald-700"
                        }`}
                        style={{ width: `${occurrenceRate}%` }}
                      />
                    )}
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white">
                      {total > 0 ? `${occurrenceRate}% (${occurrences}/${total})` : "—"}
                    </span>
                  </div>
                  <span className="w-20 text-xs text-zinc-600 text-right">
                    {isBest && "Most active"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
