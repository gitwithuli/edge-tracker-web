"use client";

import { DayPnL, formatPnL, isWeekend, isToday, isFuture } from "./calendar-utils";

interface CalendarDayCellProps {
  date: string;
  dayData: DayPnL | null;
  isCurrentMonth: boolean;
  variant?: "compact" | "full";
  onClick?: () => void;
}

export function CalendarDayCell({
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
        relative flex flex-col items-start justify-start text-left transition-all
        ${isCompact ? "p-1 sm:p-1.5 min-h-[44px] sm:min-h-[52px]" : "p-2 min-h-[72px] sm:min-h-[80px]"}
        rounded-lg border
        ${today
          ? "border-[#C45A3B]/50 dark:border-[#C45A3B]/50"
          : "border-transparent"
        }
        ${isCurrentMonth && !future
          ? `hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 cursor-pointer ${getPnLColor()}`
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
          ${isCompact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}
          font-medium leading-none
          ${today
            ? "text-[#C45A3B]"
            : isCurrentMonth
              ? "text-[#0F0F0F] dark:text-white"
              : "text-[#0F0F0F]/30 dark:text-white/30"
          }
        `}
      >
        {dayNumber}
      </span>

      {/* Trade data */}
      {hasTrades && (
        <div className={`mt-1 ${isCompact ? "space-y-0" : "space-y-0.5"} w-full`}>
          {/* P&L */}
          <div
            className={`
              ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"}
              font-semibold leading-tight ${getPnLTextColor()}
            `}
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {formatPnL(
              dayData.hasDollarPnL ? dayData.dollarPnL! : dayData.pointsPnL,
              dayData.hasDollarPnL
            )}
          </div>

          {/* Trade count and win rate */}
          {!isCompact && (
            <div className="text-[9px] text-[#0F0F0F]/40 dark:text-white/40 leading-tight">
              {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? "s" : ""}
              <span className="mx-1">·</span>
              <span className={dayData.winRate >= 50 ? "text-[#8B9A7D]" : "text-[#C45A3B]"}>
                {dayData.winRate}%
              </span>
            </div>
          )}

          {/* Compact: just show trade count */}
          {isCompact && (
            <div className="text-[8px] sm:text-[9px] text-[#0F0F0F]/40 dark:text-white/40 leading-tight">
              {dayData.tradeCount}t
            </div>
          )}
        </div>
      )}

      {/* Today indicator dot */}
      {today && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C45A3B]" />
      )}
    </button>
  );
}
