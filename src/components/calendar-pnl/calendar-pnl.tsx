"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar, Share2, Expand } from "lucide-react";
import Link from "next/link";
import type { TradeLog, TradeLogInput, LogType, Edge } from "@/lib/types";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarWeekSummary } from "./calendar-week-summary";
import { CalendarDaySheet } from "./calendar-day-sheet";
import { ShareCalendarDialog } from "./share-calendar-dialog";
import { calculateMonthPnL, parseDate } from "./calendar-utils";

export interface CalendarPnLProps {
  logs: TradeLog[];
  edges: Edge[];
  title?: string;
  variant?: "compact" | "full";
  showWeeklySummary?: boolean;
  showExpandLink?: boolean;
  defaultLogType?: LogType;
  onAddLog?: (edgeId: string, data: TradeLogInput) => void;
  onDeleteLog?: (logId: string) => void;
  onUpdateLog?: (logId: string, data: TradeLogInput, newEdgeId?: string) => void;
}

export function CalendarPnL({
  logs,
  edges,
  title,
  variant = "full",
  showWeeklySummary = true,
  showExpandLink = false,
  defaultLogType = "FRONTTEST",
  onAddLog,
  onDeleteLog,
  onUpdateLog,
}: CalendarPnLProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Day sheet state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayLogs, setSelectedDayLogs] = useState<TradeLog[]>([]);

  // Calculate month stats (memoized)
  const monthStats = useMemo(
    () => calculateMonthPnL(logs, currentYear, currentMonth),
    [logs, currentYear, currentMonth]
  );

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  }, []);

  const handleDayClick = useCallback((date: string, dayLogs: TradeLog[]) => {
    setSelectedDate(date);
    setSelectedDayLogs(dayLogs);
  }, []);

  const handleDaySheetClose = useCallback(() => {
    setSelectedDate(null);
    setSelectedDayLogs([]);
  }, []);

  const isCompact = variant === "compact";
  const showSidebar = showWeeklySummary && !isCompact;

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10">
      {/* Header with title */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
          <h3
            className="text-lg tracking-tight dark:text-white"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {title || "Calendar P&L"}
          </h3>
        </div>
        <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Share button */}
          <ShareCalendarDialog
            logs={logs}
            year={currentYear}
            month={currentMonth}
            title={title}
            trigger={
              <button
                className="p-2 rounded-lg hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white"
                title="Share calendar"
              >
                <Share2 className="w-4 h-4" />
              </button>
            }
          />

          {/* Expand link */}
          {showExpandLink && (
            <Link
              href="/dashboard/calendar"
              className="p-2 rounded-lg hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white"
              title="Full calendar view"
            >
              <Expand className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Calendar content */}
      <div className={showSidebar ? "flex gap-6" : ""}>
        {/* Main calendar area */}
        <div className={showSidebar ? "flex-1" : ""}>
          <CalendarHeader
            year={currentYear}
            month={currentMonth}
            monthStats={monthStats}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            variant={variant}
          />

          <CalendarGrid
            logs={logs}
            year={currentYear}
            month={currentMonth}
            variant={variant}
            onDayClick={handleDayClick}
          />
        </div>

        {/* Weekly summary sidebar */}
        {showSidebar && (
          <div className="w-48 shrink-0 hidden lg:block">
            <CalendarWeekSummary weeks={monthStats.weeks} month={currentMonth} />
          </div>
        )}
      </div>

      {/* Day detail sheet */}
      {selectedDate && onAddLog && (
        <CalendarDaySheet
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!open) handleDaySheetClose();
          }}
          date={selectedDate}
          logs={selectedDayLogs}
          edges={edges}
          defaultLogType={defaultLogType}
          onAddLog={onAddLog}
          onDeleteLog={onDeleteLog}
          onUpdateLog={onUpdateLog}
        />
      )}
    </div>
  );
}
