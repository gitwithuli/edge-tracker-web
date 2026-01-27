"use client";

import { WeekPnL, formatPnL, parseDate } from "./calendar-utils";
import { format } from "date-fns";

interface CalendarWeekSummaryProps {
  weeks: WeekPnL[];
  month: number;
  horizontal?: boolean;
}

export function CalendarWeekSummary({ weeks, month, horizontal = false }: CalendarWeekSummaryProps) {
  const activeWeeks = weeks.filter((week) => week.tradingDays > 0);

  if (horizontal) {
    return (
      <div className="pt-2">
        <div className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider mb-2.5">
          Weekly Summary
        </div>
        <div className="flex gap-2 pb-1" style={{ minWidth: "min-content" }}>
          {activeWeeks.map((week, idx) => {
            const pnl = week.hasDollarPnL ? week.dollarPnL! : week.pointsPnL;
            const isPositive = pnl >= 0;
            const weekStartDate = parseDate(week.weekStart);
            const weekEndDate = parseDate(week.weekEnd);

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
                  shrink-0 p-2.5 sm:p-3 rounded-lg transition-colors min-w-[120px]
                  ${isPositive
                    ? "bg-[#8B9A7D]/10 dark:bg-[#8B9A7D]/10"
                    : "bg-[#C45A3B]/10 dark:bg-[#C45A3B]/10"
                  }
                `}
              >
                <div className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 mb-1">
                  {weekLabel}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    isPositive ? "text-[#8B9A7D]" : "text-[#C45A3B]"
                  }`}
                  style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                >
                  {formatPnL(pnl, week.hasDollarPnL)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#0F0F0F]/50 dark:text-white/50">
                  <span>{week.tradingDays}d</span>
                  <span className="text-[#0F0F0F]/50 dark:text-white/50">·</span>
                  <span>{week.totalTrades}t</span>
                  <span className="text-[#0F0F0F]/50 dark:text-white/50">·</span>
                  <span className={week.winRate >= 50 ? "text-[#8B9A7D]" : "text-[#C45A3B]"}>
                    {week.winRate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider mb-3">
        Weekly Summary
      </div>

      {activeWeeks.map((week, idx) => {
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
            <div className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 mb-1.5">
              {weekLabel}
            </div>

            {/* P&L */}
            <div
              className={`text-sm font-semibold ${
                isPositive ? "text-[#8B9A7D]" : "text-[#C45A3B]"
              }`}
              style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
            >
              {formatPnL(pnl, week.hasDollarPnL)}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#0F0F0F]/50 dark:text-white/50">
              <span>{week.tradingDays}d</span>
              <span className="text-[#0F0F0F]/50 dark:text-white/50">·</span>
              <span>{week.totalTrades}t</span>
              <span className="text-[#0F0F0F]/50 dark:text-white/50">·</span>
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
