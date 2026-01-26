"use client";

import { WeekPnL, formatPnL, parseDate } from "./calendar-utils";
import { format } from "date-fns";

interface CalendarWeekSummaryProps {
  weeks: WeekPnL[];
  month: number;
}

export function CalendarWeekSummary({ weeks, month }: CalendarWeekSummaryProps) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider mb-3">
        Weekly Summary
      </div>

      {weeks.map((week, idx) => {
        // Skip weeks with no trading days in the current month
        if (week.tradingDays === 0) return null;

        const pnl = week.hasDollarPnL ? week.dollarPnL! : week.pointsPnL;
        const isPositive = pnl >= 0;
        const weekStartDate = parseDate(week.weekStart);
        const weekEndDate = parseDate(week.weekEnd);

        // Format week label (e.g., "Jan 6-12" or "Dec 30 - Jan 5")
        const startMonth = weekStartDate.getMonth();
        const endMonth = weekEndDate.getMonth();
        let weekLabel: string;

        if (startMonth === endMonth) {
          weekLabel = `${format(weekStartDate, "MMM d")}-${format(weekEndDate, "d")}`;
        } else {
          weekLabel = `${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d")}`;
        }

        return (
          <div
            key={idx}
            className={`
              p-3 rounded-lg transition-colors
              ${isPositive
                ? "bg-[#8B9A7D]/10 dark:bg-[#8B9A7D]/10"
                : "bg-[#C45A3B]/10 dark:bg-[#C45A3B]/10"
              }
            `}
          >
            {/* Week dates */}
            <div className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 mb-1.5">
              {weekLabel}
            </div>

            {/* P&L */}
            <div
              className={`text-sm font-semibold ${
                isPositive ? "text-[#8B9A7D]" : "text-[#C45A3B]"
              }`}
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {formatPnL(pnl, week.hasDollarPnL)}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#0F0F0F]/40 dark:text-white/40">
              <span>{week.tradingDays}d</span>
              <span className="text-[#0F0F0F]/20 dark:text-white/20">·</span>
              <span>{week.totalTrades}t</span>
              <span className="text-[#0F0F0F]/20 dark:text-white/20">·</span>
              <span className={week.winRate >= 50 ? "text-[#8B9A7D]" : "text-[#C45A3B]"}>
                {week.winRate}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
