import { describe, it, expect } from 'vitest';
import {
  calculateEdgeStats,
  calculateDayStats,
  calculateStatsByLogType,
  countTradingDays,
  formatOccurrenceContext,
} from './edge-stats';
import type { TradeLog } from './types';

const createLog = (overrides: Partial<TradeLog> = {}): TradeLog => ({
  id: '1',
  edgeId: 'edge-1',
  result: 'OCCURRED',
  outcome: 'WIN',
  logType: 'FRONTTEST',
  dayOfWeek: 'Monday',
  durationMinutes: 30,
  note: '',
  tvLinks: [],
  date: '2024-01-15',
  entryPrice: null,
  exitPrice: null,
  stopLoss: null,
  entryTime: null,
  exitTime: null,
  dailyOpen: null,
  dailyHigh: null,
  dailyLow: null,
  dailyClose: null,
  nyOpen: null,
  positionSize: null,
  direction: null,
  symbol: null,
  ...overrides,
});

describe('edge-stats', () => {
  describe('countTradingDays', () => {
    it('counts weekdays correctly for a single week', () => {
      // Monday to Friday = 5 trading days
      const count = countTradingDays('2025-01-20', '2025-01-24');
      expect(count).toBe(5);
    });

    it('excludes weekends', () => {
      // Friday to Monday = 2 trading days (Fri + Mon)
      const count = countTradingDays('2025-01-24', '2025-01-27');
      expect(count).toBe(2);
    });

    it('returns 1 for same day if weekday', () => {
      // Single Monday
      const count = countTradingDays('2025-01-20', '2025-01-20');
      expect(count).toBe(1);
    });

    it('returns 0 for weekend only', () => {
      // Saturday to Sunday
      const count = countTradingDays('2025-01-25', '2025-01-26');
      expect(count).toBe(0);
    });

    it('returns 0 if start is after end', () => {
      const count = countTradingDays('2025-01-26', '2025-01-20');
      expect(count).toBe(0);
    });

    it('handles two week span correctly', () => {
      // Two full weeks = 10 trading days
      const count = countTradingDays('2025-01-13', '2025-01-24');
      expect(count).toBe(10);
    });
  });

  describe('calculateEdgeStats', () => {
    it('calculates stats for empty logs', () => {
      const stats = calculateEdgeStats([]);
      expect(stats.totalLogs).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.occurrenceRate).toBe(0);
    });

    it('calculates win rate correctly', () => {
      const logs = [
        createLog({ outcome: 'WIN' }),
        createLog({ outcome: 'WIN' }),
        createLog({ outcome: 'LOSS' }),
        createLog({ outcome: 'LOSS' }),
      ];
      const stats = calculateEdgeStats(logs);
      expect(stats.winRate).toBe(50);
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(2);
    });

    it('calculates occurrence rate based on trading days', () => {
      const logs = [
        createLog({ result: 'OCCURRED' }),
        createLog({ result: 'OCCURRED' }),
      ];
      // Edge created 10 trading days ago
      const tenTradingDaysAgo = new Date();
      tenTradingDaysAgo.setDate(tenTradingDaysAgo.getDate() - 14); // ~2 weeks = ~10 trading days

      const stats = calculateEdgeStats(logs, tenTradingDaysAgo);

      // 2 occurrences / ~10 trading days = ~20%
      expect(stats.tradingDays).toBeGreaterThanOrEqual(8);
      expect(stats.tradingDays).toBeLessThanOrEqual(12);
      expect(stats.occurred).toBe(2);
    });

    it('falls back to log-based calculation when no createdAt provided', () => {
      const logs = [
        createLog({ result: 'OCCURRED' }),
        createLog({ result: 'OCCURRED' }),
        createLog({ result: 'NO_SETUP' }),
      ];
      const stats = calculateEdgeStats(logs);
      expect(stats.occurrenceRate).toBe(67); // 2/3 = 66.67% rounded to 67%
      expect(stats.occurred).toBe(2);
    });

    it('excludes NO_SETUP from win rate calculation', () => {
      const logs = [
        createLog({ result: 'OCCURRED', outcome: 'WIN' }),
        createLog({ result: 'NO_SETUP', outcome: null }),
      ];
      const stats = calculateEdgeStats(logs);
      expect(stats.winRate).toBe(100); // 1 win out of 1 occurred
    });
  });

  describe('calculateDayStats', () => {
    it('returns stats for all weekdays', () => {
      const logs = [
        createLog({ dayOfWeek: 'Monday', outcome: 'WIN' }),
        createLog({ dayOfWeek: 'Monday', outcome: 'LOSS' }),
        createLog({ dayOfWeek: 'Friday', outcome: 'WIN' }),
      ];
      const dayStats = calculateDayStats(logs);

      expect(dayStats).toHaveLength(5);
      expect(dayStats[0].day).toBe('Monday');
      expect(dayStats[0].total).toBe(2);
      expect(dayStats[0].rate).toBe(50);
      expect(dayStats[4].day).toBe('Friday');
      expect(dayStats[4].total).toBe(1);
      expect(dayStats[4].rate).toBe(100);
    });

    it('excludes NO_SETUP from day stats', () => {
      const logs = [
        createLog({ dayOfWeek: 'Monday', result: 'OCCURRED', outcome: 'WIN' }),
        createLog({ dayOfWeek: 'Monday', result: 'NO_SETUP', outcome: null }),
      ];
      const dayStats = calculateDayStats(logs);
      expect(dayStats[0].total).toBe(1);
    });
  });

  describe('calculateStatsByLogType', () => {
    it('filters by log type', () => {
      const logs = [
        createLog({ logType: 'FRONTTEST', outcome: 'WIN' }),
        createLog({ logType: 'FRONTTEST', outcome: 'LOSS' }),
        createLog({ logType: 'BACKTEST', outcome: 'WIN' }),
      ];

      const fronttestStats = calculateStatsByLogType(logs, 'FRONTTEST');
      expect(fronttestStats.totalLogs).toBe(2);
      expect(fronttestStats.winRate).toBe(50);

      const backtestStats = calculateStatsByLogType(logs, 'BACKTEST');
      expect(backtestStats.totalLogs).toBe(1);
      expect(backtestStats.winRate).toBe(100);
    });
  });

  describe('formatOccurrenceContext', () => {
    it('formats zero trading days', () => {
      expect(formatOccurrenceContext(0, 0)).toBe('No data yet');
    });

    it('formats single day', () => {
      expect(formatOccurrenceContext(1, 1)).toBe('1 occurrence in 1 trading day');
    });

    it('formats multiple days with multiple occurrences', () => {
      expect(formatOccurrenceContext(5, 18)).toBe('5 occurrences in 18 trading days');
    });

    it('formats multiple days with single occurrence', () => {
      expect(formatOccurrenceContext(1, 10)).toBe('1 occurrence in 10 trading days');
    });
  });
});
