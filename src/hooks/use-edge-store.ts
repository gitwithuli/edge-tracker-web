import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Edge, EdgeInput, TradeLog, TradeLogInput, EdgeWithLogs, UserSubscription, Feature, LogType } from '@/lib/types';
import { enqueue, dequeue, getQueue, markRetried } from '@/lib/request-queue';
import { mapEdgeFromDb, mapLogFromDb, mapSubscriptionFromDb } from '@/lib/database.types';

interface LoadingStates {
  fetchingEdges: boolean;
  fetchingLogs: boolean;
  addingEdge: boolean;
  updatingEdgeId: string | null;
  deletingEdgeId: string | null;
  addingLog: boolean;
  deletingLogId: string | null;
  updatingLogId: string | null;
  checkingMfa: boolean;
  enrollingMfa: boolean;
  verifyingMfa: boolean;
  challengingMfa: boolean;
  fetchingSubscription: boolean;
}

interface MfaEnrollResult {
  qrCode: string;
  secret: string;
  factorId: string;
}

interface EdgeStore {
  edges: Edge[];
  logs: TradeLog[];
  user: User | null;
  isLoaded: boolean;
  error: string | null;
  loadingStates: LoadingStates;
  mfaEnabled: boolean;
  subscription: UserSubscription | null;
  activeLogMode: LogType;

  // Computed
  getEdgesWithLogs: () => EdgeWithLogs[];
  getLogsByEdge: (edgeId: string) => TradeLog[];
  getSubEdges: (parentEdgeId: string) => Edge[];
  getParentEdge: (edgeId: string) => Edge | undefined;
  getParentEdges: () => Edge[]; // Edges that have no parent (top-level)

  // Subscription
  canAccess: (feature: Feature) => boolean;
  isPaid: () => boolean;

  // Setters
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setActiveLogMode: (mode: LogType) => void;

  // Auth
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;

  // Edge CRUD
  fetchEdges: () => Promise<void>;
  addEdge: (data: EdgeInput) => Promise<string | null>;
  updateEdge: (edgeId: string, data: EdgeInput) => Promise<void>;
  deleteEdge: (edgeId: string) => Promise<void>;
  updateEdgeSharing: (edgeId: string, isPublic: boolean, showTrades?: boolean, showScreenshots?: boolean) => Promise<string | null>;

  // Log CRUD
  fetchLogs: () => Promise<void>;
  addLog: (edgeId: string, logData: TradeLogInput) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  updateLog: (logId: string, logData: TradeLogInput, newEdgeId?: string) => Promise<void>;

  // MFA
  checkMfaStatus: () => Promise<void>;
  enrollMfa: () => Promise<MfaEnrollResult | null>;
  verifyMfa: (factorId: string, code: string) => Promise<boolean>;
  challengeMfa: (code: string) => Promise<boolean>;

  // Subscription
  fetchSubscription: () => Promise<void>;

  // Queue
  processPendingOperations: () => Promise<void>;
}

const initialLoadingStates: LoadingStates = {
  fetchingEdges: false,
  fetchingLogs: false,
  addingEdge: false,
  updatingEdgeId: null,
  deletingEdgeId: null,
  addingLog: false,
  deletingLogId: null,
  updatingLogId: null,
  checkingMfa: false,
  enrollingMfa: false,
  verifyingMfa: false,
  challengingMfa: false,
  fetchingSubscription: false,
};

// Type aliases for cleaner code - mapping functions imported from database.types.ts
const mapDbToEdge = mapEdgeFromDb;
const mapDbToLog = mapLogFromDb;
const mapDbToSubscription = mapSubscriptionFromDb;

/**
 * Wraps a promise-like with a timeout to prevent operations from hanging indefinitely.
 * If the operation doesn't complete within the timeout, rejects with 'Operation timed out'.
 * Used for Supabase queries that may hang without resolving (e.g., on connection issues).
 */
const OPERATION_TIMEOUT_MS = 15000;
function withTimeout<T>(promiseLike: PromiseLike<T>, timeoutMs: number = OPERATION_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

// Shared helper to map TradeLogInput to DB column format (avoids duplication across addLog, updateLog, processPendingOperations)
function mapLogToDbRow(logData: TradeLogInput, defaults?: { edgeId?: string; originalLog?: TradeLog }) {
  const orig = defaults?.originalLog;
  const outcome = logData.result === 'OCCURRED' ? (logData.outcome || null) : null;
  const tvLinks = logData.tvLinks || orig?.tvLinks || [];
  const logType = logData.logType || orig?.logType || 'FRONTTEST';
  const date = logData.date || orig?.date || new Date().toISOString().split('T')[0];
  const edgeId = defaults?.edgeId || orig?.edgeId;

  return {
    ...(edgeId ? { edge_id: edgeId } : {}),
    result: logData.result,
    outcome,
    log_type: logType,
    day_of_week: logData.dayOfWeek,
    duration_minutes: logData.durationMinutes,
    note: logData.note || '',
    tv_links: tvLinks,
    date,
    entry_price: logData.entryPrice ?? orig?.entryPrice ?? null,
    exit_price: logData.exitPrice ?? orig?.exitPrice ?? null,
    stop_loss: logData.stopLoss ?? orig?.stopLoss ?? null,
    entry_time: logData.entryTime ?? orig?.entryTime ?? null,
    exit_time: logData.exitTime ?? orig?.exitTime ?? null,
    daily_open: logData.dailyOpen ?? orig?.dailyOpen ?? null,
    daily_high: logData.dailyHigh ?? orig?.dailyHigh ?? null,
    daily_low: logData.dailyLow ?? orig?.dailyLow ?? null,
    daily_close: logData.dailyClose ?? orig?.dailyClose ?? null,
    ny_open: logData.nyOpen ?? orig?.nyOpen ?? null,
    position_size: logData.positionSize ?? orig?.positionSize ?? null,
    direction: logData.direction ?? orig?.direction ?? null,
    symbol: logData.symbol ?? orig?.symbol ?? null,
  };
}

// Track auth initialization state outside the store to prevent multiple initializations
let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;
let visibilityHandler: (() => void) | null = null;

export const useEdgeStore = create<EdgeStore>((set, get) => ({
  edges: [],
  logs: [],
  user: null,
  isLoaded: false,
  error: null,
  loadingStates: initialLoadingStates,
  mfaEnabled: false,
  subscription: null,
  activeLogMode: 'FRONTTEST' as LogType,

  // Computed: Get edges with their logs attached
  getEdgesWithLogs: () => {
    const { edges, logs } = get();
    return edges.map(edge => ({
      ...edge,
      logs: logs.filter(log => log.edgeId === edge.id),
    }));
  },

  // Computed: Get logs for a specific edge
  getLogsByEdge: (edgeId: string) => {
    return get().logs.filter(log => log.edgeId === edgeId);
  },

  // Computed: Get sub-edges for a parent edge
  getSubEdges: (parentEdgeId: string) => {
    return get().edges.filter(edge => edge.parentEdgeId === parentEdgeId);
  },

  // Computed: Get parent edge for a sub-edge
  getParentEdge: (edgeId: string) => {
    const edge = get().edges.find(e => e.id === edgeId);
    if (!edge?.parentEdgeId) return undefined;
    return get().edges.find(e => e.id === edge.parentEdgeId);
  },

  // Computed: Get all top-level edges (no parent)
  getParentEdges: () => {
    return get().edges.filter(edge => !edge.parentEdgeId);
  },

  // Subscription: Check if user can access a feature
  canAccess: (feature: Feature) => {
    const { subscription } = get();
    const tier = subscription?.tier;

    // Coming soon — always false
    if (['ai_parser', 'voice_journal', 'ai_summaries'].includes(feature)) {
      return false;
    }

    // Trial and Paid: full access
    if (tier === 'trial' || tier === 'paid') {
      return true;
    }

    // Free / unpaid: backtest only, 1 edge, 14-day history
    if (tier === 'free' || tier === 'unpaid') {
      if (feature === 'backtest') return true;
      // Everything else blocked for free tier (forwardtest, macros, export, unlimited_edges)
      return false;
    }

    return false;
  },

  // Subscription: Check if user has active (trial or paid) tier
  isPaid: () => {
    const { subscription } = get();
    return subscription?.tier === 'paid' || subscription?.tier === 'trial';
  },

  setUser: (user) => set({ user, isLoaded: true }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setActiveLogMode: (mode) => set({ activeLogMode: mode }),

  initializeAuth: async () => {
    // Prevent multiple initializations (e.g., from multiple tabs or re-renders)
    if (authInitialized) {
      return;
    }
    authInitialized = true;

    try {
      // Helper to add timeout to any promise
      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), ms)
          ),
        ]);
      };

      let user = null;

      // Try getSession first (fast, uses cached token)
      // Using longer timeouts to handle Supabase free tier cold starts
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 15000);
        user = session?.user || null;
      } catch {
        // getSession failed/timed out - try getUser which forces a fresh API call
        console.log('getSession timed out, trying getUser...');
        try {
          const { data: { user: freshUser } } = await withTimeout(supabase.auth.getUser(), 15000);
          user = freshUser;
        } catch {
          // Both failed - session is likely corrupted
          console.log('getUser also failed, clearing session...');
          user = null;
        }
      }

      if (user) {
        set({ user, isLoaded: true });
        // Fetch subscription first — fetchLogs depends on tier for history filtering
        await get().fetchSubscription();
        await Promise.all([
          get().fetchEdges(),
          get().fetchLogs(),
          get().checkMfaStatus(),
        ]);
      } else {
        set({ isLoaded: true });
      }

      // Clean up any existing subscription before adding new one
      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          set({ user: session.user });
          // Fetch subscription first — fetchLogs depends on tier for history filtering
          await get().fetchSubscription();
          await Promise.all([
            get().fetchEdges(),
            get().fetchLogs(),
            get().checkMfaStatus(),
          ]);
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, logs: [], edges: [], mfaEnabled: false, subscription: null });
        }
      });
      authSubscription = subscription;

      // Set up visibility listener to process pending operations when tab becomes active
      if (typeof document !== 'undefined') {
        // Clean up existing listener if any (prevents duplicates on HMR)
        if (visibilityHandler) {
          document.removeEventListener('visibilitychange', visibilityHandler);
        }
        visibilityHandler = () => {
          if (document.visibilityState === 'visible') {
            get().processPendingOperations();
          }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        // Process any pending operations from previous session
        setTimeout(() => get().processPendingOperations(), 2000);
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
      // On timeout or error, clear potentially corrupted session and let user re-login
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout errors
      }
      set({ user: null, isLoaded: true });
      // Show user-friendly message
      toast.error('Session expired. Please sign in again.');
    }
  },

  logout: async () => {
    // Clean up auth subscription
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }
    // Clean up visibility listener
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    authInitialized = false;

    // Clear local state and redirect immediately — don't wait for network
    set({ user: null, logs: [], edges: [], error: null, mfaEnabled: false, subscription: null });
    window.location.href = '/';

    // Revoke server session in the background
    supabase.auth.signOut().catch(() => {});
  },

  // === EDGE CRUD ===

  fetchEdges: async () => {
    const { user } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, fetchingEdges: true }, error: null });

    const { data, error } = await supabase
      .from('edges')
      .select('id, user_id, name, description, enabled_fields, symbol, parent_edge_id, is_public, public_slug, show_trades, show_screenshots, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('fetchEdges error:', error.message);
      set({
        error: 'Failed to fetch edges',
        loadingStates: { ...get().loadingStates, fetchingEdges: false }
      });
      toast.error('Failed to fetch edges. Please try again.');
      return;
    }

    set({
      edges: (data || []).map(mapDbToEdge),
      loadingStates: { ...get().loadingStates, fetchingEdges: false }
    });
  },

  addEdge: async (data) => {
    const { user, edges, canAccess } = get();
    if (!user) return null;

    // Free tier: max 1 edge
    if (!canAccess('unlimited_edges') && edges.length >= 1) {
      toast.error('Free plan is limited to 1 edge. Upgrade to add more.');
      return null;
    }

    set({ loadingStates: { ...get().loadingStates, addingEdge: true }, error: null });

    // Queue the operation for recovery if it fails
    const queueId = enqueue({ type: 'addEdge', payload: { data } });

    try {
      const { data: newEdge, error } = await supabase
        .from('edges')
        .insert([{
          user_id: user.id,
          name: data.name,
          description: data.description || '',
          enabled_fields: data.enabledFields || [],
          symbol: data.symbol || null,
          parent_edge_id: data.parentEdgeId || null,
        }])
        .select()
        .single();

      if (error) {
        dequeue(queueId); // Remove from queue - server error, not retryable
        console.error('addEdge error:', error.message);
        set({ error: 'Failed to create edge' });
        toast.error('Failed to create edge. Please try again.');
        return null;
      }

      if (!newEdge) {
        dequeue(queueId);
        set({ error: 'Failed to create edge - no data returned' });
        toast.error('Failed to create edge. Please try again.');
        return null;
      }

      dequeue(queueId); // Success - remove from queue
      set({ edges: [...get().edges, mapDbToEdge(newEdge)] });
      toast.success('Edge created successfully');
      return newEdge.id as string;
    } catch (err) {
      // Keep in queue for retry on visibility change
      console.error('addEdge error:', err);
      toast.error('Save pending - keep this tab active or return later');
      return null;
    } finally {
      set({ loadingStates: { ...get().loadingStates, addingEdge: false } });
    }
  },

  updateEdge: async (edgeId, data) => {
    const { edges } = get();

    set({ loadingStates: { ...get().loadingStates, updatingEdgeId: edgeId }, error: null });

    const originalEdge = edges.find(e => e.id === edgeId);
    if (!originalEdge) {
      toast.error('Edge not found');
      set({ loadingStates: { ...get().loadingStates, updatingEdgeId: null } });
      return;
    }

    const updatedEdge: Edge = { ...originalEdge, ...data };
    set({ edges: edges.map(e => e.id === edgeId ? updatedEdge : e) });

    try {
      const { error } = await withTimeout(
        supabase
          .from('edges')
          .update({
            name: data.name,
            description: data.description || '',
            enabled_fields: data.enabledFields || [],
            symbol: data.symbol || null,
            parent_edge_id: data.parentEdgeId || null,
          })
          .eq('id', edgeId)
      );

      if (error) {
        console.error('updateEdge error:', error.message);
        set({ edges, error: 'Failed to update edge' });
        toast.error('Failed to update edge. Please try again.');
        return;
      }

      toast.success('Edge updated');
    } catch (err) {
      console.error('updateEdge error:', err);
      set({ edges });
      const isTimeout = err instanceof Error && err.message === 'Operation timed out';
      toast.error(isTimeout ? 'Update timed out. Please try again.' : 'Failed to update edge');
    } finally {
      set({ loadingStates: { ...get().loadingStates, updatingEdgeId: null } });
    }
  },

  deleteEdge: async (edgeId) => {
    const { edges, logs } = get();

    set({ loadingStates: { ...get().loadingStates, deletingEdgeId: edgeId }, error: null });

    // Also get sub-edges that will be cascade deleted
    const subEdgeIds = edges.filter(e => e.parentEdgeId === edgeId).map(e => e.id);
    const allDeletedEdgeIds = [edgeId, ...subEdgeIds];
    const deletedEdges = edges.filter(e => allDeletedEdgeIds.includes(e.id));
    const deletedLogs = logs.filter(l => allDeletedEdgeIds.includes(l.edgeId));

    set({
      edges: edges.filter(e => !allDeletedEdgeIds.includes(e.id)),
      logs: logs.filter(l => !allDeletedEdgeIds.includes(l.edgeId)),
    });

    try {
      const { error } = await supabase.from('edges').delete().eq('id', edgeId);

      if (error) {
        console.error('deleteEdge error:', error.message);
        set({
          edges: [...get().edges, ...deletedEdges],
          logs: [...get().logs, ...deletedLogs],
          error: 'Failed to delete edge',
        });
        toast.error('Failed to delete edge. Please try again.');
        return;
      }

      toast.success('Edge deleted');
    } catch (err) {
      console.error('deleteEdge error:', err);
      set({
        edges: [...get().edges, ...deletedEdges],
        logs: [...get().logs, ...deletedLogs],
      });
      toast.error('Failed to delete edge');
    } finally {
      set({ loadingStates: { ...get().loadingStates, deletingEdgeId: null } });
    }
  },

  updateEdgeSharing: async (edgeId, isPublic, showTrades = true, showScreenshots = true) => {
    const { edges } = get();

    set({ loadingStates: { ...get().loadingStates, updatingEdgeId: edgeId }, error: null });

    const originalEdge = edges.find(e => e.id === edgeId);
    if (!originalEdge) {
      toast.error('Edge not found');
      set({ loadingStates: { ...get().loadingStates, updatingEdgeId: null } });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('edges')
        .update({
          is_public: isPublic,
          show_trades: showTrades,
          show_screenshots: showScreenshots,
        })
        .eq('id', edgeId)
        .select()
        .single();

      if (error) {
        console.error('updateEdgeSharing error:', error.message);
        set({ error: 'Failed to update sharing' });
        toast.error('Failed to update sharing. Please try again.');
        return null;
      }

      const updatedEdge = mapDbToEdge(data);
      set({ edges: edges.map(e => e.id === edgeId ? updatedEdge : e) });

      if (isPublic) {
        toast.success('Edge is now public');
      } else {
        toast.success('Edge is now private');
      }

      return updatedEdge.publicSlug || null;
    } catch (err) {
      console.error('updateEdgeSharing error:', err);
      toast.error('Failed to update sharing');
      return null;
    } finally {
      set({ loadingStates: { ...get().loadingStates, updatingEdgeId: null } });
    }
  },

  // === LOG CRUD ===

  fetchLogs: async () => {
    const { user, canAccess } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, fetchingLogs: true }, error: null });

    let query = supabase
      .from('logs')
      .select('id, user_id, edge_id, result, outcome, log_type, day_of_week, duration_minutes, note, tv_links, date, entry_price, exit_price, stop_loss, entry_time, exit_time, daily_open, daily_high, daily_low, daily_close, ny_open, position_size, direction, symbol, created_at')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Free tier: only fetch last 14 days of logs
    const { subscription } = get();
    const tier = subscription?.tier;
    if (tier === 'free' || tier === 'unpaid') {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      query = query.gte('date', fourteenDaysAgo.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('fetchLogs error:', error.message);
      set({
        error: 'Failed to fetch logs',
        loadingStates: { ...get().loadingStates, fetchingLogs: false }
      });
      toast.error('Failed to fetch logs. Please try again.');
      return;
    }

    set({
      logs: (data || []).map(mapDbToLog),
      loadingStates: { ...get().loadingStates, fetchingLogs: false }
    });
  },

  addLog: async (edgeId, logData) => {
    const { user, logs } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, addingLog: true }, error: null });

    // Queue the operation for recovery if it fails
    const queueId = enqueue({ type: 'addLog', payload: { edgeId, logData } });

    const tempId = `temp-${Date.now()}`;
    const logDate = logData.date || new Date().toISOString().split('T')[0];
    const logType = logData.logType || 'FRONTTEST';
    const outcome = logData.result === 'OCCURRED' ? (logData.outcome || null) : null;
    const tvLinks = logData.tvLinks || [];
    const optimisticLog: TradeLog = {
      id: tempId,
      edgeId,
      date: logDate,
      logType,
      result: logData.result,
      outcome,
      dayOfWeek: logData.dayOfWeek,
      durationMinutes: logData.durationMinutes,
      note: logData.note || '',
      tvLinks,
      // Optional fields
      entryPrice: logData.entryPrice ?? null,
      exitPrice: logData.exitPrice ?? null,
      stopLoss: logData.stopLoss ?? null,
      entryTime: logData.entryTime ?? null,
      exitTime: logData.exitTime ?? null,
      dailyOpen: logData.dailyOpen ?? null,
      dailyHigh: logData.dailyHigh ?? null,
      dailyLow: logData.dailyLow ?? null,
      dailyClose: logData.dailyClose ?? null,
      nyOpen: logData.nyOpen ?? null,
      positionSize: logData.positionSize ?? null,
      direction: logData.direction ?? null,
      symbol: logData.symbol ?? null,
    };

    set({ logs: [optimisticLog, ...logs] });

    try {
      // Force immediate execution by converting to a real Promise
      const query = supabase
        .from('logs')
        .insert([{
          user_id: user.id,
          ...mapLogToDbRow(logData, { edgeId }),
        }])
        .select()
        .single();

      // Execute the query and wrap result in Promise
      const { data, error } = await withTimeout(
        query.then(res => res)
      );

      if (error) {
        dequeue(queueId); // Server error - not retryable
        console.error('addLog error:', error.message);
        set({ logs: logs.filter(l => l.id !== tempId), error: 'Failed to add log' });
        toast.error('Failed to add log. Please try again.');
        return;
      }

      if (!data) {
        dequeue(queueId);
        set({ logs: logs.filter(l => l.id !== tempId), error: 'Failed to save log - no data returned' });
        toast.error('Failed to save log. Please try again.');
        return;
      }

      dequeue(queueId); // Success - remove from queue
      const newLog = mapDbToLog(data);
      set({ logs: get().logs.map(l => l.id === tempId ? newLog : l) });
      toast.success('Trade logged');
    } catch (err) {
      console.error('addLog error:', err);
      const isTimeout = err instanceof Error && err.message === 'Operation timed out';
      if (isTimeout) {
        dequeue(queueId);
        set({ logs: logs.filter(l => l.id !== tempId) });
        toast.error('Save timed out. Please try again.');
      } else {
        // Keep in queue for retry on visibility change
        // Keep the optimistic log visible - it will be synced when tab becomes active
        toast.error('Save pending - will retry when connection restored', {
          duration: 5000,
          description: 'Keep this tab open or return later',
        });
      }
    } finally {
      set({ loadingStates: { ...get().loadingStates, addingLog: false } });
    }
  },

  deleteLog: async (logId) => {
    const { logs } = get();

    set({ loadingStates: { ...get().loadingStates, deletingLogId: logId }, error: null });

    const deletedLog = logs.find(l => l.id === logId);
    set({ logs: logs.filter(l => l.id !== logId) });

    try {
      const { error } = await supabase.from('logs').delete().eq('id', logId);

      if (error) {
        console.error('deleteLog error:', error.message);
        set({
          logs: deletedLog ? [...get().logs, deletedLog] : logs,
          error: 'Failed to delete log',
        });
        toast.error('Failed to delete log. Please try again.');
        return;
      }

      toast.success('Trade log deleted');
    } catch (err) {
      console.error('deleteLog error:', err);
      set({ logs: deletedLog ? [...get().logs, deletedLog] : logs });
      toast.error('Failed to delete log');
    } finally {
      set({ loadingStates: { ...get().loadingStates, deletingLogId: null } });
    }
  },

  updateLog: async (logId, logData, newEdgeId) => {
    const { logs } = get();

    // Don't attempt to update temp IDs - they haven't been saved yet
    if (logId.startsWith('temp-')) {
      toast.error('Please wait for the log to finish saving before editing');
      return;
    }

    set({ loadingStates: { ...get().loadingStates, updatingLogId: logId }, error: null });

    const originalLog = logs.find(l => l.id === logId);
    if (!originalLog) {
      toast.error('Log not found');
      set({ loadingStates: { ...get().loadingStates, updatingLogId: null } });
      return;
    }

    const outcome = logData.result === 'OCCURRED' ? (logData.outcome || null) : null;
    const tvLinks = logData.tvLinks || originalLog.tvLinks || [];
    const targetEdgeId = newEdgeId || originalLog.edgeId;

    const updatedLog: TradeLog = {
      ...originalLog,
      ...logData,
      edgeId: targetEdgeId,
      outcome,
      tvLinks,
      logType: logData.logType || originalLog.logType,
      date: logData.date || originalLog.date,
      entryPrice: logData.entryPrice ?? originalLog.entryPrice ?? null,
      exitPrice: logData.exitPrice ?? originalLog.exitPrice ?? null,
      stopLoss: logData.stopLoss ?? originalLog.stopLoss ?? null,
      entryTime: logData.entryTime ?? originalLog.entryTime ?? null,
      exitTime: logData.exitTime ?? originalLog.exitTime ?? null,
      dailyOpen: logData.dailyOpen ?? originalLog.dailyOpen ?? null,
      dailyHigh: logData.dailyHigh ?? originalLog.dailyHigh ?? null,
      dailyLow: logData.dailyLow ?? originalLog.dailyLow ?? null,
      dailyClose: logData.dailyClose ?? originalLog.dailyClose ?? null,
      nyOpen: logData.nyOpen ?? originalLog.nyOpen ?? null,
      positionSize: logData.positionSize ?? originalLog.positionSize ?? null,
      direction: logData.direction ?? originalLog.direction ?? null,
      symbol: logData.symbol ?? originalLog.symbol ?? null,
    };

    // Queue the operation for recovery if it fails
    const queueId = enqueue({ type: 'updateLog', payload: { logId, logData, newEdgeId, originalLog } });

    // Optimistic update
    set({ logs: logs.map(l => l.id === logId ? updatedLog : l) });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('logs')
          .update(mapLogToDbRow(logData, { edgeId: targetEdgeId, originalLog }))
          .eq('id', logId)
          .select()
          .single()
      );

      if (error) {
        dequeue(queueId); // Server error - not retryable
        console.error('updateLog error:', error.message);
        set({ logs, error: 'Failed to update log' });
        toast.error('Failed to update log. Please try again.');
        return;
      }

      if (!data) {
        dequeue(queueId);
        set({ logs, error: 'Update failed - log not found in database' });
        toast.error('Update failed - log not found. Please refresh the page.');
        return;
      }

      dequeue(queueId); // Success - remove from queue
      const confirmedLog = mapDbToLog(data);
      set({ logs: get().logs.map(l => l.id === logId ? confirmedLog : l) });
      toast.success('Trade log updated');
    } catch (err) {
      console.error('updateLog error:', err);
      const isTimeout = err instanceof Error && err.message === 'Operation timed out';
      if (isTimeout) {
        dequeue(queueId);
        toast.error('Update timed out. Please try again.');
      } else {
        // Keep in queue for retry - don't revert optimistic update
        toast.error('Update pending - will retry when connection restored', {
          duration: 5000,
          description: 'Keep this tab open or return later',
        });
      }
    } finally {
      set({ loadingStates: { ...get().loadingStates, updatingLogId: null } });
    }
  },

  // === MFA ===

  checkMfaStatus: async () => {
    set({ loadingStates: { ...get().loadingStates, checkingMfa: true } });

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error('Failed to check MFA status:', error.message);
        set({ loadingStates: { ...get().loadingStates, checkingMfa: false } });
        return;
      }

      const hasVerifiedTotp = data.totp.some(factor => factor.status === 'verified');
      set({
        mfaEnabled: hasVerifiedTotp,
        loadingStates: { ...get().loadingStates, checkingMfa: false }
      });
    } catch (err) {
      console.error('MFA status check failed:', err);
      set({ loadingStates: { ...get().loadingStates, checkingMfa: false } });
    }
  },

  enrollMfa: async () => {
    set({ loadingStates: { ...get().loadingStates, enrollingMfa: true } });

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) {
        console.error('MFA enrollment error:', error.message);
        toast.error('Failed to start MFA enrollment. Please try again.');
        set({ loadingStates: { ...get().loadingStates, enrollingMfa: false } });
        return null;
      }

      set({ loadingStates: { ...get().loadingStates, enrollingMfa: false } });

      return {
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
      };
    } catch (err) {
      console.error('MFA enrollment failed:', err);
      toast.error('Failed to start MFA enrollment');
      set({ loadingStates: { ...get().loadingStates, enrollingMfa: false } });
      return null;
    }
  },

  verifyMfa: async (factorId: string, code: string) => {
    set({ loadingStates: { ...get().loadingStates, verifyingMfa: true } });

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        console.error('MFA challenge error:', challengeError.message);
        toast.error('MFA verification failed. Please try again.');
        set({ loadingStates: { ...get().loadingStates, verifyingMfa: false } });
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        set({ loadingStates: { ...get().loadingStates, verifyingMfa: false } });
        return false;
      }

      set({
        mfaEnabled: true,
        loadingStates: { ...get().loadingStates, verifyingMfa: false }
      });
      toast.success('Two-factor authentication enabled');
      return true;
    } catch (err) {
      console.error('MFA verification failed:', err);
      set({ loadingStates: { ...get().loadingStates, verifyingMfa: false } });
      return false;
    }
  },

  challengeMfa: async (code: string) => {
    set({ loadingStates: { ...get().loadingStates, challengingMfa: true } });

    try {
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError || !factorsData.totp.length) {
        toast.error('No MFA factors found');
        set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
        return false;
      }

      const verifiedFactor = factorsData.totp.find(f => f.status === 'verified');
      if (!verifiedFactor) {
        toast.error('No verified MFA factor found');
        set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
        return false;
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });

      if (challengeError) {
        console.error('MFA challenge error:', challengeError.message);
        toast.error('MFA challenge failed. Please try again.');
        set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: challengeData.id,
        code,
      });

      set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });

      if (verifyError) {
        return false;
      }

      return true;
    } catch (err) {
      console.error('MFA challenge failed:', err);
      set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
      return false;
    }
  },

  // === SUBSCRIPTION ===

  fetchSubscription: async () => {
    const { user } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, fetchingSubscription: true } });

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, subscription_tier, current_period_start, current_period_end, cancel_at_period_end, trial_started_at, trial_ends_at, payment_provider, payment_id, payment_status, created_at, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no subscription record exists, create one with trial tier
        if (error.code === 'PGRST116') {
          const trialEnds = new Date();
          trialEnds.setDate(trialEnds.getDate() + 7);

          const { data: newSub, error: insertError } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: user.id,
              subscription_tier: 'trial',
              trial_started_at: new Date().toISOString(),
              trial_ends_at: trialEnds.toISOString(),
            }, { onConflict: 'user_id', ignoreDuplicates: true })
            .select()
            .single();

          if (!insertError && newSub) {
            set({
              subscription: mapDbToSubscription(newSub),
              loadingStates: { ...get().loadingStates, fetchingSubscription: false }
            });
            return;
          }
        }
        console.error('Failed to fetch subscription:', error.message);
        set({ loadingStates: { ...get().loadingStates, fetchingSubscription: false } });
        return;
      }

      let subscription = mapDbToSubscription(data);

      // Check if trial has expired → auto-downgrade to 'free'
      if (subscription.tier === 'trial' && subscription.trialEndsAt) {
        const now = new Date();
        const trialEnd = new Date(subscription.trialEndsAt);
        if (now > trialEnd) {
          await supabase
            .from('user_subscriptions')
            .update({ subscription_tier: 'free' })
            .eq('user_id', user.id);
          subscription = { ...subscription, tier: 'free' };
        }
      }

      set({
        subscription,
        loadingStates: { ...get().loadingStates, fetchingSubscription: false }
      });
    } catch (err) {
      console.error('Subscription fetch failed:', err);
      set({ loadingStates: { ...get().loadingStates, fetchingSubscription: false } });
    }
  },

  // === QUEUE PROCESSING ===

  processPendingOperations: async () => {
    const { user } = get();
    if (!user) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    console.log(`[Queue] Processing ${queue.length} pending operations...`);

    for (const op of queue) {
      try {
        switch (op.type) {
          case 'addEdge': {
            const { data: edgeData } = op.payload as { data: EdgeInput };
            const { data, error } = await supabase
              .from('edges')
              .insert([{
                user_id: user.id,
                name: edgeData.name,
                description: edgeData.description || '',
                enabled_fields: edgeData.enabledFields || [],
                symbol: edgeData.symbol || null,
                parent_edge_id: edgeData.parentEdgeId || null,
              }])
              .select()
              .single();

            if (!error && data) {
              set({ edges: [...get().edges, mapDbToEdge(data)] });
              dequeue(op.id);
              toast.success(`Edge "${edgeData.name}" created (recovered)`);
            }
            break;
          }

          case 'addLog': {
            const { edgeId, logData } = op.payload as { edgeId: string; logData: TradeLogInput };

            const { data, error } = await supabase
              .from('logs')
              .insert([{
                user_id: user.id,
                ...mapLogToDbRow(logData, { edgeId }),
              }])
              .select()
              .single();

            if (!error && data) {
              const newLog = mapDbToLog(data);
              // Remove any temp log and add the real one
              set({ logs: [newLog, ...get().logs.filter(l => !l.id.startsWith('temp-'))] });
              dequeue(op.id);
              toast.success('Trade log saved (recovered)');
            }
            break;
          }

          case 'updateLog': {
            const { logId, logData, newEdgeId, originalLog } = op.payload as {
              logId: string;
              logData: TradeLogInput;
              newEdgeId?: string;
              originalLog: TradeLog;
            };
            const targetEdgeId = newEdgeId || originalLog.edgeId;

            const { data, error } = await supabase
              .from('logs')
              .update(mapLogToDbRow(logData, { edgeId: targetEdgeId, originalLog }))
              .eq('id', logId)
              .select()
              .single();

            if (!error && data) {
              const confirmedLog = mapDbToLog(data);
              set({ logs: get().logs.map(l => l.id === logId ? confirmedLog : l) });
              dequeue(op.id);
              toast.success('Trade log updated (recovered)');
            }
            break;
          }

          default:
            // For other types, just remove from queue
            dequeue(op.id);
        }
      } catch (err) {
        console.error(`[Queue] Failed to process ${op.type}:`, err);
        // Track retry count - if max retries exceeded, notify user and remove
        const canRetry = markRetried(op.id);
        if (!canRetry) {
          // Operation permanently failed after max retries
          toast.error(`Failed to save ${op.type === 'addLog' ? 'trade log' : op.type === 'addEdge' ? 'edge' : 'update'}. Please try again manually.`, {
            duration: 10000,
            description: 'The operation failed after multiple attempts.',
          });
        }
      }
    }
  },
}));
