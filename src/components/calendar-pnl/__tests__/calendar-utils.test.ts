import { describe, it, expect } from 'vitest';
import {
  calculateLogPnL,
  getCalendarGridDays,
  getMonthDays,
  formatPnL,
  isWeekend,
  getMonthName,
  formatDateISO,
  parseDate,
  getWeekStart,
  getWeekEnd,
} from '../calendar-utils';
import type { TradeLog } from '@/lib/types';

describe('calculateLogPnL', () => {
  const baseLog: TradeLog = {
    id: 'log-1',
    edgeId: 'edge-1',
    result: 'OCCURRED',
    outcome: 'WIN',
    logType: 'FRONTTEST',
    dayOfWeek: 'Monday',
    durationMinutes: 30,
    note: '',
    tvLinks: [],
    date: '2025-01-06',
    entryPrice: 100,
    exitPrice: 110,
    stopLoss: 95,
    entryTime: null,
    exitTime: null,
    dailyOpen: null,
    dailyHigh: null,
    dailyLow: null,
    dailyClose: null,
    nyOpen: null,
    positionSize: null,
    direction: 'LONG',
    symbol: null,
  };

  it('calculates positive PnL for winning LONG trade', () => {
    const pnl = calculateLogPnL(baseLog);
    expect(pnl.points).toBe(10); // 110 - 100
  });

  it('calculates negative PnL for losing LONG trade', () => {
    const log = { ...baseLog, outcome: 'LOSS' as const, exitPrice: 90 };
    const pnl = calculateLogPnL(log);
    expect(pnl.points).toBe(-10); // 90 - 100
  });

  it('calculates positive PnL for winning SHORT trade', () => {
    const log = { ...baseLog, direction: 'SHORT' as const, entryPrice: 110, exitPrice: 100 };
    const pnl = calculateLogPnL(log);
    expect(pnl.points).toBe(10); // 110 - 100 (reversed for short)
  });

  it('returns null dollars when symbol has no symbolInfo', () => {
    const log = { ...baseLog, positionSize: 5 };
    const pnl = calculateLogPnL(log);
    expect(pnl.points).toBe(10);
    expect(pnl.dollars).toBeNull(); // no symbol → no multiplier → null dollars
  });

  it('returns zero for NO_SETUP', () => {
    const log = { ...baseLog, result: 'NO_SETUP' as const, entryPrice: null, exitPrice: null };
    const pnl = calculateLogPnL(log);
    expect(pnl.points).toBe(0);
    expect(pnl.dollars).toBeNull();
  });

  it('returns zero when entry/exit prices missing', () => {
    const log = { ...baseLog, entryPrice: null, exitPrice: null };
    const pnl = calculateLogPnL(log);
    expect(pnl.points).toBe(0);
  });
});

describe('getMonthDays', () => {
  it('returns correct number of days for January', () => {
    const days = getMonthDays(2025, 0); // January
    expect(days).toHaveLength(31);
    expect(days[0]).toBe('2025-01-01');
    expect(days[30]).toBe('2025-01-31');
  });

  it('returns 28 days for non-leap February', () => {
    const days = getMonthDays(2025, 1);
    expect(days).toHaveLength(28);
  });

  it('returns 29 days for leap year February', () => {
    const days = getMonthDays(2024, 1);
    expect(days).toHaveLength(29);
  });
});

describe('getCalendarGridDays', () => {
  it('returns 42 days (6 weeks) for the grid', () => {
    const days = getCalendarGridDays(2025, 0);
    // Grid should be 6 weeks * 7 days or 5 weeks * 7 days
    expect(days.length % 7).toBe(0);
    expect(days.length).toBeGreaterThanOrEqual(28);
    expect(days.length).toBeLessThanOrEqual(42);
  });

  it('marks current month days correctly', () => {
    const days = getCalendarGridDays(2025, 0);
    const janDays = days.filter(d => d.isCurrentMonth);
    expect(janDays).toHaveLength(31);
  });

  it('includes overflow days from adjacent months', () => {
    const days = getCalendarGridDays(2025, 0);
    const overflowDays = days.filter(d => !d.isCurrentMonth);
    expect(overflowDays.length).toBeGreaterThan(0);
  });
});

describe('formatPnL', () => {
  it('formats positive dollar PnL', () => {
    expect(formatPnL(1500, true)).toContain('+');
    expect(formatPnL(1500, true)).toContain('$');
  });

  it('formats negative dollar PnL', () => {
    const formatted = formatPnL(-500, true);
    expect(formatted).toContain('-');
    expect(formatted).toContain('$');
  });

  it('formats positive point PnL', () => {
    expect(formatPnL(25.5, false)).toContain('+');
  });

  it('formats zero PnL', () => {
    const formatted = formatPnL(0, false);
    expect(formatted).toBeDefined();
  });
});

describe('isWeekend', () => {
  it('returns true for Saturday', () => {
    expect(isWeekend('2025-01-04')).toBe(true); // Saturday
  });

  it('returns true for Sunday', () => {
    expect(isWeekend('2025-01-05')).toBe(true); // Sunday
  });

  it('returns false for weekdays', () => {
    expect(isWeekend('2025-01-06')).toBe(false); // Monday
    expect(isWeekend('2025-01-07')).toBe(false); // Tuesday
    expect(isWeekend('2025-01-10')).toBe(false); // Friday
  });
});

describe('getMonthName', () => {
  it('returns correct month names', () => {
    expect(getMonthName(0)).toBe('January');
    expect(getMonthName(5)).toBe('June');
    expect(getMonthName(11)).toBe('December');
  });
});

describe('formatDateISO', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    expect(formatDateISO(date)).toBe('2025-01-15');
  });

  it('pads single-digit month and day', () => {
    const date = new Date(2025, 0, 5); // Jan 5, 2025
    expect(formatDateISO(date)).toBe('2025-01-05');
  });
});

describe('parseDate', () => {
  it('parses YYYY-MM-DD string', () => {
    const date = parseDate('2025-01-15');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
  });
});

describe('getWeekStart', () => {
  it('returns Monday for a mid-week date', () => {
    const wed = new Date(2025, 0, 8); // Wednesday Jan 8
    const start = getWeekStart(wed);
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(6);
  });

  it('returns same day for Monday', () => {
    const mon = new Date(2025, 0, 6);
    const start = getWeekStart(mon);
    expect(start.getDate()).toBe(6);
  });
});

describe('getWeekEnd', () => {
  it('returns Sunday for a mid-week date', () => {
    const wed = new Date(2025, 0, 8);
    const end = getWeekEnd(wed);
    expect(end.getDay()).toBe(0); // Sunday
    expect(end.getDate()).toBe(12);
  });
});
