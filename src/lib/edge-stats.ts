/**
 * Centralized edge statistics calculation
 * Used across dashboard, scorecards, and stats components
 *
 * Occurrence Rate is calculated based on trading days since edge creation,
 * not based on total logs. This gives an accurate picture of how often
 * an edge appears in the market.
 */

import type { TradeLog } from './types';

export interface EdgeStats {
  totalLogs: number;
  occurred: number;
  wins: number;
  losses: number;
  tradingDays: number;
  occurrenceRate: number;
  winRate: number;
  bestDay: string | null;
  bestDayRate: number;
}

export interface DayStats {
  day: string;
  total: number;
  wins: number;
  rate: number;
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Count weekdays (Mon-Fri) between two dates, inclusive of both dates
 */
export function countTradingDays(startDate: Date | string, endDate: Date | string = new Date()): number {
  // Parse dates - handle string dates by adding time component to avoid timezone issues
  const parseDate = (d: Date | string): Date => {
    if (typeof d === 'string') {
      // Add noon time to avoid timezone boundary issues
      return new Date(d + 'T12:00:00');
    }
    return new Date(d);
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  // Normalize to start of day in local time
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  // If start is after end, return 0
  if (start > end) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Calculate comprehensive stats for a set of trade logs
 *
 * @param logs - Array of trade logs
 * @param edgeCreatedAt - The date the edge was created (for occurrence rate calculation)
 */
export function calculateEdgeStats(logs: TradeLog[], edgeCreatedAt?: Date | string): EdgeStats {
  const totalLogs = logs.length;
  const occurredLogs = logs.filter(l => l.result === 'OCCURRED');
  const occurred = occurredLogs.length;

  const wins = occurredLogs.filter(l => l.outcome === 'WIN').length;
  const losses = occurredLogs.filter(l => l.outcome === 'LOSS').length;

  // Calculate trading days since edge creation
  const tradingDays = edgeCreatedAt ? countTradingDays(edgeCreatedAt) : 0;

  // Occurrence rate based on trading days (not total logs)
  // If no createdAt provided, fall back to old calculation for backward compatibility
  const occurrenceRate = tradingDays > 0
    ? Math.round((occurred / tradingDays) * 100)
    : (totalLogs > 0 ? Math.round((occurred / totalLogs) * 100) : 0);

  const winRate = occurred > 0 ? Math.round((wins / occurred) * 100) : 0;

  // Calculate best day
  const { bestDay, bestDayRate } = calculateBestDay(occurredLogs);

  return {
    totalLogs,
    occurred,
    wins,
    losses,
    tradingDays,
    occurrenceRate,
    winRate,
    bestDay,
    bestDayRate,
  };
}

/**
 * Calculate stats broken down by day of week
 */
export function calculateDayStats(logs: TradeLog[]): DayStats[] {
  const occurredLogs = logs.filter(l => l.result === 'OCCURRED');

  return DAYS_ORDER.map(day => {
    const dayLogs = occurredLogs.filter(l => l.dayOfWeek === day);
    const wins = dayLogs.filter(l => l.outcome === 'WIN').length;
    const total = dayLogs.length;
    const rate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return { day, total, wins, rate };
  });
}

/**
 * Find the best performing day by win rate
 */
function calculateBestDay(occurredLogs: TradeLog[]): { bestDay: string | null; bestDayRate: number } {
  const dayStats = DAYS_ORDER.map(day => {
    const dayLogs = occurredLogs.filter(l => l.dayOfWeek === day);
    const wins = dayLogs.filter(l => l.outcome === 'WIN').length;
    const total = dayLogs.length;
    return {
      day,
      total,
      rate: total >= 3 ? Math.round((wins / total) * 100) : 0, // Require 3+ trades for validity
    };
  });

  const best = dayStats.reduce((a, b) => (b.rate > a.rate ? b : a), { day: '', total: 0, rate: 0 });

  return {
    bestDay: best.rate > 0 ? best.day : null,
    bestDayRate: best.rate,
  };
}

/**
 * Calculate stats for a specific log type (BACKTEST or FRONTTEST)
 */
export function calculateStatsByLogType(
  logs: TradeLog[],
  logType: 'BACKTEST' | 'FRONTTEST',
  edgeCreatedAt?: Date | string
): EdgeStats {
  const filteredLogs = logs.filter(l => l.logType === logType);
  return calculateEdgeStats(filteredLogs, edgeCreatedAt);
}

/**
 * Calculate aggregated stats across multiple edges
 * Note: For aggregate stats, we use the earliest edge creation date
 */
export function calculateAggregateStats(
  allLogs: TradeLog[],
  earliestCreatedAt?: Date | string
): EdgeStats {
  return calculateEdgeStats(allLogs, earliestCreatedAt);
}

/**
 * Format trading days for display
 * e.g., "5 occurrences in 18 trading days"
 */
export function formatOccurrenceContext(occurred: number, tradingDays: number): string {
  if (tradingDays === 0) return 'No data yet';
  if (tradingDays === 1) return `${occurred} occurrence in 1 trading day`;
  return `${occurred} occurrence${occurred !== 1 ? 's' : ''} in ${tradingDays} trading days`;
}
