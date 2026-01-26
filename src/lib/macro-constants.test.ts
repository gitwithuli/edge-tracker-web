import { describe, it, expect } from 'vitest';
import { formatMacroTime, ALL_MACROS, MACRO_DIRECTIONS, DISPLACEMENT_QUALITIES } from './macro-constants';

describe('macro-constants', () => {
  describe('formatMacroTime', () => {
    it('formats morning time correctly', () => {
      expect(formatMacroTime(9, 30)).toBe('9:30 AM');
    });

    it('formats afternoon time correctly', () => {
      expect(formatMacroTime(14, 15)).toBe('2:15 PM');
    });

    it('formats noon correctly', () => {
      expect(formatMacroTime(12, 0)).toBe('12:00 PM');
    });

    it('formats midnight correctly', () => {
      expect(formatMacroTime(0, 0)).toBe('12:00 AM');
    });

    it('pads minutes with zero', () => {
      expect(formatMacroTime(9, 5)).toBe('9:05 AM');
    });
  });

  describe('ALL_MACROS', () => {
    it('has valid time ranges (handles overnight macros)', () => {
      ALL_MACROS.forEach(macro => {
        const startMinutes = macro.startHour * 60 + macro.startMinute;
        const endMinutes = macro.endHour * 60 + macro.endMinute;
        // Overnight macros may have end time less than start (crossing midnight)
        // Just verify times are in valid range
        expect(startMinutes).toBeGreaterThanOrEqual(0);
        expect(startMinutes).toBeLessThan(1440);
        expect(endMinutes).toBeGreaterThanOrEqual(0);
        expect(endMinutes).toBeLessThan(1440);
      });
    });

    it('has unique ids', () => {
      const ids = ALL_MACROS.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('has valid categories', () => {
      // Just verify each macro has a defined category
      ALL_MACROS.forEach(macro => {
        expect(macro.category).toBeDefined();
        expect(typeof macro.category).toBe('string');
        expect(macro.category.length).toBeGreaterThan(0);
      });
    });

    it('has required fields', () => {
      ALL_MACROS.forEach(macro => {
        expect(macro.id).toBeDefined();
        expect(macro.name).toBeDefined();
        expect(typeof macro.startHour).toBe('number');
        expect(typeof macro.startMinute).toBe('number');
        expect(typeof macro.endHour).toBe('number');
        expect(typeof macro.endMinute).toBe('number');
      });
    });
  });

  describe('constants', () => {
    it('MACRO_DIRECTIONS has expected values', () => {
      expect(MACRO_DIRECTIONS).toContain('BULLISH');
      expect(MACRO_DIRECTIONS).toContain('BEARISH');
      expect(MACRO_DIRECTIONS).toContain('CONSOLIDATION');
    });

    it('DISPLACEMENT_QUALITIES has expected values', () => {
      expect(DISPLACEMENT_QUALITIES).toContain('CLEAN');
      expect(DISPLACEMENT_QUALITIES).toContain('CHOPPY');
    });
  });
});
