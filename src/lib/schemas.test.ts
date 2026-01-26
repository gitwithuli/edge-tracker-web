import { describe, it, expect } from 'vitest';
import { tradeLogInputSchema, edgeInputSchema } from './schemas';

describe('schemas', () => {
  describe('tradeLogInputSchema', () => {
    it('validates a valid trade log input', () => {
      const validLog = {
        result: 'OCCURRED',
        outcome: 'WIN',
        logType: 'FRONTTEST',
        dayOfWeek: 'Monday',
        durationMinutes: 30,
        note: 'Test note',
        date: '2024-01-15',
      };

      const result = tradeLogInputSchema.safeParse(validLog);
      expect(result.success).toBe(true);
    });

    it('rejects invalid result type', () => {
      const invalidLog = {
        result: 'INVALID',
        logType: 'FRONTTEST',
        dayOfWeek: 'Monday',
        durationMinutes: 30,
      };

      const result = tradeLogInputSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });

    it('validates optional price fields', () => {
      const logWithPrices = {
        result: 'OCCURRED',
        outcome: 'WIN',
        logType: 'FRONTTEST',
        dayOfWeek: 'Monday',
        durationMinutes: 45,
        entryPrice: 100.50,
        exitPrice: 105.25,
        stopLoss: 98.00,
      };

      const result = tradeLogInputSchema.safeParse(logWithPrices);
      expect(result.success).toBe(true);
    });

    it('validates TV links array', () => {
      const logWithLinks = {
        result: 'OCCURRED',
        logType: 'FRONTTEST',
        dayOfWeek: 'Monday',
        durationMinutes: 30,
        tvLinks: ['https://www.tradingview.com/x/abc/', 'https://www.tradingview.com/x/def/'],
      };

      const result = tradeLogInputSchema.safeParse(logWithLinks);
      expect(result.success).toBe(true);
    });

    it('requires dayOfWeek field', () => {
      const missingDay = {
        result: 'OCCURRED',
        logType: 'FRONTTEST',
        durationMinutes: 30,
      };

      const result = tradeLogInputSchema.safeParse(missingDay);
      expect(result.success).toBe(false);
    });

    it('requires durationMinutes field', () => {
      const missingDuration = {
        result: 'OCCURRED',
        logType: 'FRONTTEST',
        dayOfWeek: 'Monday',
      };

      const result = tradeLogInputSchema.safeParse(missingDuration);
      expect(result.success).toBe(false);
    });
  });

  describe('edgeInputSchema', () => {
    it('validates a valid edge input', () => {
      const validEdge = {
        name: 'Test Edge',
        description: 'A test edge description',
      };

      const result = edgeInputSchema.safeParse(validEdge);
      expect(result.success).toBe(true);
    });

    it('requires name field', () => {
      const invalidEdge = {
        description: 'Missing name',
      };

      const result = edgeInputSchema.safeParse(invalidEdge);
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const emptyName = {
        name: '',
        description: 'Has empty name',
      };

      const result = edgeInputSchema.safeParse(emptyName);
      expect(result.success).toBe(false);
    });

    it('validates optional parent edge id', () => {
      const edgeWithParent = {
        name: 'Sub Edge',
        description: 'A sub-edge',
        parentEdgeId: 'parent-123',
      };

      const result = edgeInputSchema.safeParse(edgeWithParent);
      expect(result.success).toBe(true);
    });

    it('validates enabled fields array', () => {
      const edgeWithFields = {
        name: 'Edge with fields',
        enabledFields: ['entryExitPrices', 'entryExitTimes'],
      };

      const result = edgeInputSchema.safeParse(edgeWithFields);
      expect(result.success).toBe(true);
    });
  });
});
