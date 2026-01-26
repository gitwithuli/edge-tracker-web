import type { TradeLog } from "@/lib/types";
import { getSymbolInfo } from "@/lib/constants";

export interface DayPnL {
  date: string;
  logs: TradeLog[];
  tradeCount: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsPnL: number;
  dollarPnL: number | null;
  hasDollarPnL: boolean;
}

export interface WeekPnL {
  weekStart: string; // ISO date of Monday
  weekEnd: string; // ISO date of Sunday
  days: DayPnL[];
  tradingDays: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsPnL: number;
  dollarPnL: number | null;
  hasDollarPnL: boolean;
}

export interface MonthPnL {
  year: number;
  month: number; // 0-indexed
  weeks: WeekPnL[];
  daysByDate: Map<string, DayPnL>;
  tradingDays: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsPnL: number;
  dollarPnL: number | null;
  hasDollarPnL: boolean;
}

/**
 * Calculate P&L for a single trade log
 */
export function calculateLogPnL(log: TradeLog): { points: number; dollars: number | null } {
  if (!log.entryPrice || !log.exitPrice || !log.direction) {
    return { points: 0, dollars: null };
  }

  const pointsPnL = log.direction === 'LONG'
    ? log.exitPrice - log.entryPrice
    : log.entryPrice - log.exitPrice;

  const symbolInfo = log.symbol ? getSymbolInfo(log.symbol) : null;
  const dollars = symbolInfo
    ? pointsPnL * symbolInfo.multiplier * (log.positionSize || 1)
    : null;

  return { points: pointsPnL, dollars };
}

/**
 * Aggregate logs by date, returning a map of date -> DayPnL
 */
export function aggregateLogsByDay(logs: TradeLog[]): Map<string, DayPnL> {
  const dayMap = new Map<string, DayPnL>();

  // Only include logs that resulted in trades (OCCURRED)
  const tradeLogs = logs.filter(log => log.result === 'OCCURRED');

  for (const log of tradeLogs) {
    const date = log.date;
    let dayData = dayMap.get(date);

    if (!dayData) {
      dayData = {
        date,
        logs: [],
        tradeCount: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        pointsPnL: 0,
        dollarPnL: null,
        hasDollarPnL: false,
      };
      dayMap.set(date, dayData);
    }

    dayData.logs.push(log);
    dayData.tradeCount++;

    if (log.outcome === 'WIN') {
      dayData.wins++;
    } else if (log.outcome === 'LOSS') {
      dayData.losses++;
    }

    const { points, dollars } = calculateLogPnL(log);
    dayData.pointsPnL += points;

    if (dollars !== null) {
      dayData.dollarPnL = (dayData.dollarPnL || 0) + dollars;
      dayData.hasDollarPnL = true;
    }
  }

  // Calculate win rates
  for (const dayData of dayMap.values()) {
    dayData.winRate = dayData.tradeCount > 0
      ? Math.round((dayData.wins / dayData.tradeCount) * 100)
      : 0;
  }

  return dayMap;
}

/**
 * Get the Monday of the week for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Get the Sunday of the week for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse ISO date string to Date at noon
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00');
}

/**
 * Get all days in a month as ISO date strings
 */
export function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const date = new Date(year, month, 1, 12, 0, 0);

  while (date.getMonth() === month) {
    days.push(formatDateISO(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
}

/**
 * Get the calendar grid days for a month (includes padding days from prev/next months)
 * Returns 6 weeks x 7 days = 42 dates
 */
export function getCalendarGridDays(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const grid: { date: string; isCurrentMonth: boolean }[] = [];

  // First day of the month
  const firstDay = new Date(year, month, 1, 12, 0, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Calculate the Monday before (or on) the first day
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const gridStart = new Date(firstDay);
  gridStart.setDate(1 - startOffset);

  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(gridStart);
    currentDate.setDate(gridStart.getDate() + i);
    grid.push({
      date: formatDateISO(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
    });
  }

  return grid;
}

/**
 * Group days into weeks
 */
export function groupDaysIntoWeeks(dayMap: Map<string, DayPnL>, year: number, month: number): WeekPnL[] {
  const weeks: WeekPnL[] = [];
  const gridDays = getCalendarGridDays(year, month);

  // Process 6 weeks
  for (let weekIdx = 0; weekIdx < 6; weekIdx++) {
    const weekDays = gridDays.slice(weekIdx * 7, (weekIdx + 1) * 7);
    const firstDayOfWeek = parseDate(weekDays[0].date);

    const week: WeekPnL = {
      weekStart: weekDays[0].date,
      weekEnd: weekDays[6].date,
      days: [],
      tradingDays: 0,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      pointsPnL: 0,
      dollarPnL: null,
      hasDollarPnL: false,
    };

    for (const { date, isCurrentMonth } of weekDays) {
      const dayData = dayMap.get(date);
      if (dayData && isCurrentMonth) {
        week.days.push(dayData);
        week.tradingDays++;
        week.totalTrades += dayData.tradeCount;
        week.wins += dayData.wins;
        week.losses += dayData.losses;
        week.pointsPnL += dayData.pointsPnL;
        if (dayData.hasDollarPnL) {
          week.dollarPnL = (week.dollarPnL || 0) + (dayData.dollarPnL || 0);
          week.hasDollarPnL = true;
        }
      }
    }

    week.winRate = week.totalTrades > 0
      ? Math.round((week.wins / week.totalTrades) * 100)
      : 0;

    weeks.push(week);
  }

  return weeks;
}

/**
 * Calculate monthly P&L statistics
 */
export function calculateMonthPnL(logs: TradeLog[], year: number, month: number): MonthPnL {
  // Filter logs to only the specified month
  const monthLogs = logs.filter(log => {
    const logDate = parseDate(log.date);
    return logDate.getFullYear() === year && logDate.getMonth() === month;
  });

  const daysByDate = aggregateLogsByDay(monthLogs);
  const weeks = groupDaysIntoWeeks(daysByDate, year, month);

  let tradingDays = 0;
  let totalTrades = 0;
  let wins = 0;
  let losses = 0;
  let pointsPnL = 0;
  let dollarPnL: number | null = null;
  let hasDollarPnL = false;

  for (const dayData of daysByDate.values()) {
    tradingDays++;
    totalTrades += dayData.tradeCount;
    wins += dayData.wins;
    losses += dayData.losses;
    pointsPnL += dayData.pointsPnL;
    if (dayData.hasDollarPnL) {
      dollarPnL = (dollarPnL || 0) + (dayData.dollarPnL || 0);
      hasDollarPnL = true;
    }
  }

  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  return {
    year,
    month,
    weeks,
    daysByDate,
    tradingDays,
    totalTrades,
    wins,
    losses,
    winRate,
    pointsPnL,
    dollarPnL: hasDollarPnL ? dollarPnL : null,
    hasDollarPnL,
  };
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  return new Date(2024, month, 1).toLocaleString('en-US', { month: 'long' });
}

/**
 * Format P&L for display
 */
export function formatPnL(value: number, isDollar: boolean): string {
  const sign = value >= 0 ? '+' : '';
  if (isDollar) {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${sign}$${(value / 1000).toFixed(absValue >= 10000 ? 0 : 1)}k`;
    }
    return `${sign}$${Math.round(value)}`;
  }
  return `${sign}${value.toFixed(1)} pts`;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(dateStr: string): boolean {
  const date = parseDate(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
  const today = formatDateISO(new Date());
  return dateStr === today;
}

/**
 * Check if a date is in the future
 */
export function isFuture(dateStr: string): boolean {
  const today = formatDateISO(new Date());
  return dateStr > today;
}
