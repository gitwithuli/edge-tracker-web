"use client";

import { memo } from "react";
import { DayPnL, formatPnL, isWeekend, isToday, isFuture } from "./calendar-utils";

interface CalendarDayCellProps {
  date: string;
  dayData: DayPnL | null;
  isCurrentMonth: boolean;
  variant?: "compact" | "full";
  onClick?: () => void;
}

export const CalendarDayCell = memo(function CalendarDayCell({
  date,
  dayData,
  isCurrentMonth,
  variant = "full",
  onClick,
}: CalendarDayCellProps) {
  const dayNumber = parseInt(date.split("-")[2], 10);
  const weekend = isWeekend(date);
  const today = isToday(date);
  const future = isFuture(date);
  const hasTrades = dayData && dayData.tradeCount > 0;

  // Determine background color based on P&L
  const getPnLColor = () => {
    if (!hasTrades) return "";
    const pnl = dayData.hasDollarPnL ? dayData.dollarPnL! : dayData.pointsPnL;
    if (pnl > 0) return "bg-[#8B9A7D]/20 dark:bg-[#8B9A7D]/20";
    if (pnl < 0) return "bg-[#C45A3B]/20 dark:bg-[#C45A3B]/20";
    return "bg-[#0F0F0F]/5 dark:bg-white/5";
  };

  const getPnLTextColor = () => {
    if (!hasTrades) return "";
    const pnl = dayData.hasDollarPnL ? dayData.dollarPnL! : dayData.pointsPnL;
    if (pnl > 0) return "text-[#8B9A7D]";
    if (pnl < 0) return "text-[#C45A3B]";
    return "text-[#0F0F0F]/60 dark:text-white/60";
  };

  const isCompact = variant === "compact";

  return (
    <button
      onClick={onClick}
      disabled={!isCurrentMonth || future}
      className={`
        relative flex flex-col items-start justify-start text-left transition-all w-full
        ${isCompact
          ? "p-0.5 sm:p-1.5 min-h-[40px] sm:min-h-[52px]"
          : "p-1 sm:p-1.5 md:p-2 aspect-square sm:aspect-auto sm:min-h-[68px] md:min-h-[80px]"
        }
        rounded-lg border
        ${today
          ? "border-[#C45A3B]/50 dark:border-[#C45A3B]/50"
          : "border-transparent"
        }
        ${isCurrentMonth && !future
          ? `hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 cursor-pointer active:scale-[0.97] ${getPnLColor()}`
          : "cursor-default"
        }
        ${!isCurrentMonth || future
          ? "opacity-30"
          : weekend && !hasTrades
            ? "opacity-50"
            : ""
        }
      `}
    >
      {/* Date number */}
      <span
        className={`
          ${isCompact ? "text-[10px] sm:text-xs" : "text-[10px] sm:text-xs md:text-sm"}
          font-medium leading-none
          ${today
            ? "text-[#C45A3B]"
            : isCurrentMonth
              ? "text-[#0F0F0F] dark:text-white"
              : "text-[#0F0F0F]/45 dark:text-white/45"
          }
        `}
      >
        {dayNumber}
      </span>

      {/* Trade data */}
      {hasTrades && (
        <div className={`mt-auto pt-0.5 sm:mt-1 sm:pt-0 ${isCompact ? "space-y-0" : "space-y-0.5"} w-full min-w-0`}>
          {/* P&L */}
          <div
            className={`
              ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[8px] sm:text-[10px] md:text-xs"}
              font-semibold leading-tight truncate ${getPnLTextColor()}
            `}
            style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
          >
            {formatPnL(
              dayData.hasDollarPnL ? dayData.dollarPnL! : dayData.pointsPnL,
              dayData.hasDollarPnL
            )}
          </div>

          {/* Trade count and win rate - hidden on very small screens in full mode */}
          {!isCompact && (
            <div className="hidden sm:block text-[8px] md:text-[9px] text-[#0F0F0F]/50 dark:text-white/50 leading-tight">
              {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? "s" : ""}
              <span className="mx-1">·</span>
              <span className={dayData.winRate >= 50 ? "text-[#8B9A7D]" : "text-[#C45A3B]"}>
                {dayData.winRate}%
              </span>
            </div>
          )}

          {/* Compact: just show trade count */}
          {isCompact && (
            <div className="text-[8px] sm:text-[9px] text-[#0F0F0F]/50 dark:text-white/50 leading-tight">
              {dayData.tradeCount}t
            </div>
          )}
        </div>
      )}

      {/* Today indicator dot */}
      {today && (
        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 rounded-full bg-[#C45A3B]" />
      )}
    </button>
  );
});
