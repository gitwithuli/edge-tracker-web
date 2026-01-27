import { describe, it, expect } from 'vitest';
import { mapEdgeFromDb, mapLogFromDb, mapSubscriptionFromDb } from '../database.types';
import type { EdgesRow, LogsRow, UserSubscriptionsRow } from '../database.types';

describe('mapEdgeFromDb', () => {
  const baseRow: EdgesRow = {
    id: 'edge-1',
    user_id: 'user-1',
    name: 'Silver Bullet',
    description: 'ICT Silver Bullet setup',
    enabled_fields: ['entryExitPrices', 'dailyOHLC'],
    symbol: 'ES',
    parent_edge_id: null,
    is_public: false,
    public_slug: null,
    show_trades: true,
    show_screenshots: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const edge = mapEdgeFromDb(baseRow);

    expect(edge.id).toBe('edge-1');
    expect(edge.userId).toBe('user-1');
    expect(edge.name).toBe('Silver Bullet');
    expect(edge.description).toBe('ICT Silver Bullet setup');
    expect(edge.enabledFields).toEqual(['entryExitPrices', 'dailyOHLC']);
    expect(edge.symbol).toBe('ES');
    expect(edge.parentEdgeId).toBeNull();
    expect(edge.isPublic).toBe(false);
    expect(edge.publicSlug).toBeNull();
    expect(edge.showTrades).toBe(true);
    expect(edge.showScreenshots).toBe(true);
    expect(edge.createdAt).toBe('2025-01-01T00:00:00Z');
    expect(edge.updatedAt).toBe('2025-01-02T00:00:00Z');
  });

  it('defaults description to empty string when null', () => {
    const row = { ...baseRow, description: '' };
    expect(mapEdgeFromDb(row).description).toBe('');
  });

  it('defaults showTrades to true when false in DB', () => {
    const row = { ...baseRow, show_trades: false };
    expect(mapEdgeFromDb(row).showTrades).toBe(false);
  });

  it('defaults enabled_fields to empty array when null', () => {
    const row = { ...baseRow, enabled_fields: [] as string[] };
    expect(mapEdgeFromDb(row).enabledFields).toEqual([]);
  });
});

describe('mapLogFromDb', () => {
  const baseRow: LogsRow = {
    id: 'log-1',
    user_id: 'user-1',
    edge_id: 'edge-1',
    result: 'OCCURRED',
    outcome: 'WIN',
    log_type: 'FRONTTEST',
    day_of_week: 'Monday',
    duration_minutes: 45,
    note: 'Clean setup',
    tv_links: ['https://tradingview.com/chart/1'],
    date: '2025-01-06',
    entry_price: 5950.25,
    exit_price: 5960.50,
    stop_loss: 5945.00,
    entry_time: '10:00',
    exit_time: '10:45',
    daily_open: 5940.00,
    daily_high: 5970.00,
    daily_low: 5935.00,
    daily_close: 5965.00,
    ny_open: 5948.00,
    position_size: 2,
    direction: 'LONG',
    symbol: 'ES',
    created_at: '2025-01-06T15:00:00Z',
  };

  it('maps all fields correctly', () => {
    const log = mapLogFromDb(baseRow);

    expect(log.id).toBe('log-1');
    expect(log.edgeId).toBe('edge-1');
    expect(log.result).toBe('OCCURRED');
    expect(log.outcome).toBe('WIN');
    expect(log.logType).toBe('FRONTTEST');
    expect(log.dayOfWeek).toBe('Monday');
    expect(log.durationMinutes).toBe(45);
    expect(log.note).toBe('Clean setup');
    expect(log.tvLinks).toEqual(['https://tradingview.com/chart/1']);
    expect(log.date).toBe('2025-01-06');
    expect(log.entryPrice).toBe(5950.25);
    expect(log.exitPrice).toBe(5960.50);
    expect(log.stopLoss).toBe(5945.00);
    expect(log.direction).toBe('LONG');
    expect(log.symbol).toBe('ES');
  });

  it('handles empty tv_links', () => {
    const row = { ...baseRow, tv_links: [] };
    expect(mapLogFromDb(row).tvLinks).toEqual([]);
  });

  it('handles null tv_links gracefully', () => {
    const row = { ...baseRow, tv_links: null as unknown as string[] };
    expect(mapLogFromDb(row).tvLinks).toEqual([]);
  });

  it('defaults logType to FRONTTEST when empty string', () => {
    const row = { ...baseRow, log_type: '' as any };
    expect(mapLogFromDb(row).logType).toBe('FRONTTEST');
  });

  it('handles null optional fields', () => {
    const row: LogsRow = {
      ...baseRow,
      outcome: null,
      entry_price: null,
      exit_price: null,
      stop_loss: null,
      entry_time: null,
      exit_time: null,
      daily_open: null,
      daily_high: null,
      daily_low: null,
      daily_close: null,
      ny_open: null,
      position_size: null,
      direction: null,
      symbol: null,
    };
    const log = mapLogFromDb(row);

    expect(log.outcome).toBeNull();
    expect(log.entryPrice).toBeNull();
    expect(log.exitPrice).toBeNull();
    expect(log.stopLoss).toBeNull();
    expect(log.direction).toBeNull();
  });
});

describe('mapSubscriptionFromDb', () => {
  const baseRow: UserSubscriptionsRow = {
    id: 'sub-1',
    user_id: 'user-1',
    subscription_tier: 'trial',
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    trial_started_at: '2025-01-01T00:00:00Z',
    trial_ends_at: '2025-01-08T00:00:00Z',
    payment_provider: null,
    payment_id: null,
    payment_status: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  it('maps trial subscription correctly', () => {
    const sub = mapSubscriptionFromDb(baseRow);

    expect(sub.id).toBe('sub-1');
    expect(sub.userId).toBe('user-1');
    expect(sub.tier).toBe('trial');
    expect(sub.trialStartedAt).toBe('2025-01-01T00:00:00Z');
    expect(sub.trialEndsAt).toBe('2025-01-08T00:00:00Z');
    expect(sub.cancelAtPeriodEnd).toBe(false);
  });

  it('maps paid subscription with payment provider', () => {
    const row: UserSubscriptionsRow = {
      ...baseRow,
      subscription_tier: 'paid',
      payment_provider: 'nowpayments',
      payment_id: 'pay-123',
      payment_status: 'finished',
      current_period_start: '2025-01-10T00:00:00Z',
      current_period_end: '2025-02-09T00:00:00Z',
    };
    const sub = mapSubscriptionFromDb(row);

    expect(sub.tier).toBe('paid');
    expect(sub.paymentProvider).toBe('nowpayments');
    expect(sub.paymentId).toBe('pay-123');
    expect(sub.paymentStatus).toBe('finished');
    expect(sub.currentPeriodStart).toBe('2025-01-10T00:00:00Z');
    expect(sub.currentPeriodEnd).toBe('2025-02-09T00:00:00Z');
  });
});
