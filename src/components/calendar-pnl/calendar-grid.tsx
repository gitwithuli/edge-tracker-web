"use client";

import { useMemo } from "react";
import type { TradeLog } from "@/lib/types";
import { CalendarDayCell } from "./calendar-day-cell";
import { getCalendarGridDays, aggregateLogsByDay, parseDate, DayPnL } from "./calendar-utils";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarGridProps {
  logs: TradeLog[];
  year: number;
  month: number;
  variant?: "compact" | "full";
  onDayClick?: (date: string, logs: TradeLog[]) => void;
}

export function CalendarGrid({
  logs,
  year,
  month,
  variant = "full",
  onDayClick,
}: CalendarGridProps) {
  // Aggregate logs by day (memoized)
  const daysByDate = useMemo(() => aggregateLogsByDay(logs), [logs]);

  // Get calendar grid days (memoized)
  const gridDays = useMemo(() => getCalendarGridDays(year, month), [year, month]);

  const handleDayClick = (date: string, dayData: DayPnL | null) => {
    if (onDayClick) {
      const logsForDay = dayData?.logs || logs.filter(log => log.date === date);
      onDayClick(date, logsForDay);
    }
  };

  const isCompact = variant === "compact";

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className={`
              text-center font-medium text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider
              ${isCompact ? "text-[8px] sm:text-[9px] py-1" : "text-[9px] sm:text-[10px] py-2"}
            `}
          >
            {isCompact ? day.charAt(0) : day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`grid grid-cols-7 ${isCompact ? "gap-0.5" : "gap-1"}`}>
        {gridDays.map(({ date, isCurrentMonth }) => {
          const dayData = daysByDate.get(date) || null;
          return (
            <CalendarDayCell
              key={date}
              date={date}
              dayData={dayData}
              isCurrentMonth={isCurrentMonth}
              variant={variant}
              onClick={() => handleDayClick(date, dayData)}
            />
          );
        })}
      </div>
    </div>
  );
}
