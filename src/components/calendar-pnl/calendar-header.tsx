"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { MonthPnL, getMonthName, formatPnL } from "./calendar-utils";

interface CalendarHeaderProps {
  year: number;
  month: number;
  monthStats: MonthPnL;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  variant?: "compact" | "full";
}

export function CalendarHeader({
  year,
  month,
  monthStats,
  onPrevMonth,
  onNextMonth,
  onToday,
  variant = "full",
}: CalendarHeaderProps) {
  const isCompact = variant === "compact";
  const monthName = getMonthName(month);

  // Check if we're viewing current month
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // P&L display
  const pnl = monthStats.hasDollarPnL ? monthStats.dollarPnL! : monthStats.pointsPnL;
  const pnlFormatted = monthStats.totalTrades > 0
    ? formatPnL(pnl, monthStats.hasDollarPnL)
    : null;
  const pnlColor = pnl >= 0 ? "text-[#8B9A7D]" : "text-[#C45A3B]";

  return (
    <div className={`flex items-center justify-between ${isCompact ? "mb-3" : "mb-4"}`}>
      {/* Month/Year and navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors text-[#0F0F0F]/60 dark:text-white/60 hover:text-[#0F0F0F] dark:hover:text-white"
          aria-label="Previous month"
        >
          <ChevronLeft className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
        </button>

        <h3
          className={`
            ${isCompact ? "text-sm sm:text-base" : "text-base sm:text-lg"}
            font-medium text-[#0F0F0F] dark:text-white tracking-tight min-w-[140px] text-center
          `}
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          {monthName} {year}
        </h3>

        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors text-[#0F0F0F]/60 dark:text-white/60 hover:text-[#0F0F0F] dark:hover:text-white"
          aria-label="Next month"
        >
          <ChevronRight className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
        </button>

        {!isCurrentMonth && (
          <button
            onClick={onToday}
            className={`
              ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full
              bg-[#0F0F0F]/5 dark:bg-white/5
              text-[#0F0F0F]/60 dark:text-white/60
              hover:bg-[#0F0F0F]/10 dark:hover:bg-white/10
              hover:text-[#0F0F0F] dark:hover:text-white
              transition-colors
              ${isCompact ? "text-[10px]" : "text-xs"}
            `}
          >
            <Calendar className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            Today
          </button>
        )}
      </div>

      {/* Monthly stats */}
      <div className={`flex items-center gap-3 ${isCompact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}`}>
        {monthStats.totalTrades > 0 ? (
          <>
            {/* P&L */}
            {pnlFormatted && (
              <span
                className={`font-semibold ${pnlColor}`}
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {pnlFormatted}
              </span>
            )}

            {/* Trading days */}
            <span className="text-[#0F0F0F]/40 dark:text-white/40">
              {monthStats.tradingDays}d / {monthStats.totalTrades}t
            </span>

            {/* Win rate */}
            <span className={monthStats.winRate >= 50 ? "text-[#8B9A7D]" : "text-[#C45A3B]"}>
              {monthStats.winRate}%
            </span>
          </>
        ) : (
          <span className="text-[#0F0F0F]/30 dark:text-white/30">No trades</span>
        )}
      </div>
    </div>
  );
}
