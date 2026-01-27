/**
 * Database types generated from Supabase schema
 * These types represent the raw database row structure
 *
 * To regenerate: npx supabase gen types typescript --local > src/lib/database.types.ts
 * (requires Supabase CLI and local database)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      edges: {
        Row: EdgesRow;
        Insert: EdgesInsert;
        Update: EdgesUpdate;
      };
      logs: {
        Row: LogsRow;
        Insert: LogsInsert;
        Update: LogsUpdate;
      };
      macro_logs: {
        Row: MacroLogsRow;
        Insert: MacroLogsInsert;
        Update: MacroLogsUpdate;
      };
      user_subscriptions: {
        Row: UserSubscriptionsRow;
        Insert: UserSubscriptionsInsert;
        Update: UserSubscriptionsUpdate;
      };
    };
  };
}

// ============================================
// EDGES TABLE
// ============================================

export interface EdgesRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  enabled_fields: string[];
  symbol: string | null;
  parent_edge_id: string | null;
  is_public: boolean;
  public_slug: string | null;
  show_trades: boolean;
  show_screenshots: boolean;
  created_at: string;
  updated_at: string;
}

export interface EdgesInsert {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  enabled_fields?: string[];
  symbol?: string | null;
  parent_edge_id?: string | null;
  is_public?: boolean;
  public_slug?: string | null;
  show_trades?: boolean;
  show_screenshots?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EdgesUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  description?: string;
  enabled_fields?: string[];
  symbol?: string | null;
  parent_edge_id?: string | null;
  is_public?: boolean;
  public_slug?: string | null;
  show_trades?: boolean;
  show_screenshots?: boolean;
  updated_at?: string;
}

// ============================================
// LOGS TABLE
// ============================================

export type ResultType = 'OCCURRED' | 'NO_SETUP';
export type OutcomeType = 'WIN' | 'LOSS';
export type LogType = 'FRONTTEST' | 'BACKTEST';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export type DirectionType = 'LONG' | 'SHORT';

export interface LogsRow {
  id: string;
  user_id: string;
  edge_id: string;
  result: ResultType;
  outcome: OutcomeType | null;
  log_type: LogType;
  day_of_week: DayOfWeek;
  duration_minutes: number;
  note: string;
  tv_links: string[];
  date: string;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  entry_time: string | null;
  exit_time: string | null;
  daily_open: number | null;
  daily_high: number | null;
  daily_low: number | null;
  daily_close: number | null;
  ny_open: number | null;
  position_size: number | null;
  direction: DirectionType | null;
  symbol: string | null;
  created_at: string;
}

export interface LogsInsert {
  id?: string;
  user_id: string;
  edge_id: string;
  result: ResultType;
  outcome?: OutcomeType | null;
  log_type?: LogType;
  day_of_week: DayOfWeek;
  duration_minutes: number;
  note?: string;
  tv_links?: string[];
  date?: string;
  entry_price?: number | null;
  exit_price?: number | null;
  stop_loss?: number | null;
  entry_time?: string | null;
  exit_time?: string | null;
  daily_open?: number | null;
  daily_high?: number | null;
  daily_low?: number | null;
  daily_close?: number | null;
  ny_open?: number | null;
  position_size?: number | null;
  direction?: DirectionType | null;
  symbol?: string | null;
}

export interface LogsUpdate {
  edge_id?: string;
  result?: ResultType;
  outcome?: OutcomeType | null;
  log_type?: LogType;
  day_of_week?: DayOfWeek;
  duration_minutes?: number;
  note?: string;
  tv_links?: string[];
  date?: string;
  entry_price?: number | null;
  exit_price?: number | null;
  stop_loss?: number | null;
  entry_time?: string | null;
  exit_time?: string | null;
  daily_open?: number | null;
  daily_high?: number | null;
  daily_low?: number | null;
  daily_close?: number | null;
  ny_open?: number | null;
  position_size?: number | null;
  direction?: DirectionType | null;
  symbol?: string | null;
}

// ============================================
// MACRO LOGS TABLE
// ============================================

export type MacroDirection = 'BULLISH' | 'BEARISH' | 'CONSOLIDATION';
export type DisplacementQuality = 'CLEAN' | 'CHOPPY';
export type LiquiditySweep = 'HIGHS' | 'LOWS' | 'BOTH' | 'NONE';

export interface MacroLogsRow {
  id: string;
  user_id: string;
  macro_id: string;
  date: string;
  points_moved: number | null;
  direction: MacroDirection | null;
  displacement_quality: DisplacementQuality | null;
  liquidity_sweep: LiquiditySweep | null;
  note: string;
  tv_links: string[];
  created_at: string;
  updated_at: string;
}

export interface MacroLogsInsert {
  id?: string;
  user_id: string;
  macro_id: string;
  date: string;
  points_moved?: number | null;
  direction?: MacroDirection | null;
  displacement_quality?: DisplacementQuality | null;
  liquidity_sweep?: LiquiditySweep | null;
  note?: string;
  tv_links?: string[];
}

export interface MacroLogsUpdate {
  points_moved?: number | null;
  direction?: MacroDirection | null;
  displacement_quality?: DisplacementQuality | null;
  liquidity_sweep?: LiquiditySweep | null;
  note?: string;
  tv_links?: string[];
  updated_at?: string;
}

// ============================================
// USER SUBSCRIPTIONS TABLE
// ============================================

export type SubscriptionTier = 'trial' | 'free' | 'paid' | 'unpaid';

export interface UserSubscriptionsRow {
  id: string;
  user_id: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  payment_provider: string | null;
  payment_id: string | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionsInsert {
  id?: string;
  user_id: string;
  subscription_tier?: SubscriptionTier;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  payment_provider?: string | null;
  payment_id?: string | null;
  payment_status?: string | null;
}

export interface UserSubscriptionsUpdate {
  subscription_tier?: SubscriptionTier;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  payment_provider?: string | null;
  payment_id?: string | null;
  payment_status?: string | null;
  updated_at?: string;
}

// ============================================
// HELPER TYPES FOR MAPPING
// ============================================

import type { Edge, TradeLog } from './schemas';
import type { UserSubscription } from './types';
import type { OptionalFieldGroup } from './schemas';

/**
 * Map database row to Edge type
 */
export function mapEdgeFromDb(row: EdgesRow): Edge {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || '',
    enabledFields: (row.enabled_fields || []) as OptionalFieldGroup[],
    symbol: row.symbol,
    parentEdgeId: row.parent_edge_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPublic: row.is_public || false,
    publicSlug: row.public_slug,
    showTrades: row.show_trades !== false,
    showScreenshots: row.show_screenshots !== false,
  };
}

/**
 * Map database row to TradeLog type
 */
export function mapLogFromDb(row: LogsRow): TradeLog {
  const tvLinks: string[] = Array.isArray(row.tv_links) ? row.tv_links : [];

  return {
    id: row.id,
    edgeId: row.edge_id,
    result: row.result,
    outcome: row.outcome,
    logType: row.log_type || 'FRONTTEST',
    dayOfWeek: row.day_of_week,
    durationMinutes: row.duration_minutes,
    note: row.note || '',
    tvLinks,
    date: row.date,
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    stopLoss: row.stop_loss,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    dailyOpen: row.daily_open,
    dailyHigh: row.daily_high,
    dailyLow: row.daily_low,
    dailyClose: row.daily_close,
    nyOpen: row.ny_open,
    positionSize: row.position_size,
    direction: row.direction,
    symbol: row.symbol,
  };
}

/**
 * Map database row to UserSubscription type
 */
export function mapSubscriptionFromDb(row: UserSubscriptionsRow): UserSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    tier: row.subscription_tier,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end || false,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    paymentProvider: row.payment_provider,
    paymentId: row.payment_id,
    paymentStatus: row.payment_status,
  };
}
