import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Edge, EdgeInput, TradeLog, TradeLogInput, EdgeWithLogs } from '@/lib/types';
import type { OptionalFieldGroup } from '@/lib/schemas';

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

  // Computed
  getEdgesWithLogs: () => EdgeWithLogs[];
  getLogsByEdge: (edgeId: string) => TradeLog[];
  getSubEdges: (parentEdgeId: string) => Edge[];
  getParentEdge: (edgeId: string) => Edge | undefined;
  getParentEdges: () => Edge[]; // Edges that have no parent (top-level)

  // Setters
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Auth
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;

  // Edge CRUD
  fetchEdges: () => Promise<void>;
  addEdge: (data: EdgeInput) => Promise<string | null>;
  updateEdge: (edgeId: string, data: EdgeInput) => Promise<void>;
  deleteEdge: (edgeId: string) => Promise<void>;

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
};

// Map database row to Edge type
function mapDbToEdge(row: Record<string, unknown>): Edge {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    enabledFields: (row.enabled_fields as OptionalFieldGroup[]) || [],
    symbol: (row.symbol as string) || null,
    parentEdgeId: (row.parent_edge_id as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Map database row to TradeLog type
function mapDbToLog(row: Record<string, unknown>): TradeLog {
  // Handle tvLinks - could be array from DB or need to migrate from tv_link
  let tvLinks: string[] = [];
  if (Array.isArray(row.tv_links) && row.tv_links.length > 0) {
    tvLinks = row.tv_links as string[];
  } else if (row.tv_link && typeof row.tv_link === 'string' && row.tv_link !== '') {
    tvLinks = [row.tv_link];
  }

  return {
    id: row.id as string,
    edgeId: row.edge_id as string,
    result: row.result as TradeLog['result'],
    outcome: (row.outcome as TradeLog['outcome']) || null,
    logType: (row.log_type as TradeLog['logType']) || 'FRONTTEST',
    dayOfWeek: row.day_of_week as TradeLog['dayOfWeek'],
    durationMinutes: row.duration_minutes as number,
    note: (row.note as string) || '',
    tvLinks,
    tvLink: tvLinks[0] || undefined, // Legacy compatibility
    date: row.date as string,
    // Optional fields
    entryPrice: row.entry_price as number | null,
    exitPrice: row.exit_price as number | null,
    entryTime: row.entry_time as string | null,
    exitTime: row.exit_time as string | null,
    dailyOpen: row.daily_open as number | null,
    dailyHigh: row.daily_high as number | null,
    dailyLow: row.daily_low as number | null,
    dailyClose: row.daily_close as number | null,
    nyOpen: row.ny_open as number | null,
    positionSize: row.position_size as number | null,
    direction: (row.direction as TradeLog['direction']) || null,
    symbol: (row.symbol as string) || null,
  };
}

export const useEdgeStore = create<EdgeStore>((set, get) => ({
  edges: [],
  logs: [],
  user: null,
  isLoaded: false,
  error: null,
  loadingStates: initialLoadingStates,
  mfaEnabled: false,

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

  setUser: (user) => set({ user, isLoaded: true }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user, isLoaded: true });
        // Parallelize independent fetches for better performance
        await Promise.all([
          get().fetchEdges(),
          get().fetchLogs(),
          get().checkMfaStatus(),
        ]);
      } else {
        set({ isLoaded: true });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          set({ user: session.user });
          // Parallelize independent fetches for better performance
          await Promise.all([
            get().fetchEdges(),
            get().fetchLogs(),
            get().checkMfaStatus(),
          ]);
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, logs: [], edges: [], mfaEnabled: false });
        }
      });
    } catch (err) {
      console.error('Auth initialization failed:', err);
      set({ isLoaded: true });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, logs: [], edges: [], error: null, mfaEnabled: false });
    window.location.href = '/';
  },

  // === EDGE CRUD ===

  fetchEdges: async () => {
    const { user } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, fetchingEdges: true }, error: null });

    const { data, error } = await supabase
      .from('edges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      const message = `Failed to fetch edges: ${error.message}`;
      set({
        error: message,
        loadingStates: { ...get().loadingStates, fetchingEdges: false }
      });
      toast.error(message);
      return;
    }

    set({
      edges: (data || []).map(mapDbToEdge),
      loadingStates: { ...get().loadingStates, fetchingEdges: false }
    });
  },

  addEdge: async (data) => {
    const { user } = get();
    if (!user) return null;

    set({ loadingStates: { ...get().loadingStates, addingEdge: true }, error: null });

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });

      const insertPromise = supabase
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

      const { data: newEdge, error } = await Promise.race([insertPromise, timeoutPromise]);

      if (error) {
        set({ error: `Failed to create edge: ${error.message}` });
        toast.error(`Failed to create edge: ${error.message}`);
        return null;
      }

      if (newEdge) {
        set({ edges: [...get().edges, mapDbToEdge(newEdge)] });
        toast.success('Edge created successfully');
        return newEdge.id as string;
      }

      return null;
    } catch (err: unknown) {
      console.error('addEdge error:', err);
      if (err instanceof Error && err.message === 'Request timed out') {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to create edge');
      }
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
      const { error } = await supabase
        .from('edges')
        .update({
          name: data.name,
          description: data.description || '',
          enabled_fields: data.enabledFields || [],
          symbol: data.symbol || null,
          parent_edge_id: data.parentEdgeId || null,
        })
        .eq('id', edgeId);

      if (error) {
        set({ edges, error: `Failed to update edge: ${error.message}` });
        toast.error(`Failed to update edge: ${error.message}`);
        return;
      }

      toast.success('Edge updated');
    } catch (err) {
      console.error('updateEdge error:', err);
      set({ edges });
      toast.error('Failed to update edge');
    } finally {
      set({ loadingStates: { ...get().loadingStates, updatingEdgeId: null } });
    }
  },

  deleteEdge: async (edgeId) => {
    const { edges, logs } = get();

    set({ loadingStates: { ...get().loadingStates, deletingEdgeId: edgeId }, error: null });

    const deletedEdge = edges.find(e => e.id === edgeId);
    const deletedLogs = logs.filter(l => l.edgeId === edgeId);

    set({
      edges: edges.filter(e => e.id !== edgeId),
      logs: logs.filter(l => l.edgeId !== edgeId),
    });

    try {
      const { error } = await supabase.from('edges').delete().eq('id', edgeId);

      if (error) {
        set({
          edges: deletedEdge ? [...get().edges, deletedEdge] : get().edges,
          logs: [...get().logs, ...deletedLogs],
          error: `Failed to delete edge: ${error.message}`,
        });
        toast.error(`Failed to delete edge: ${error.message}`);
        return;
      }

      toast.success('Edge deleted');
    } catch (err) {
      console.error('deleteEdge error:', err);
      set({
        edges: deletedEdge ? [...get().edges, deletedEdge] : get().edges,
        logs: [...get().logs, ...deletedLogs],
      });
      toast.error('Failed to delete edge');
    } finally {
      set({ loadingStates: { ...get().loadingStates, deletingEdgeId: null } });
    }
  },

  // === LOG CRUD ===

  fetchLogs: async () => {
    const { user } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, fetchingLogs: true }, error: null });

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      const message = `Failed to fetch logs: ${error.message}`;
      set({
        error: message,
        loadingStates: { ...get().loadingStates, fetchingLogs: false }
      });
      toast.error(message);
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

    const tempId = `temp-${Date.now()}`;
    const logDate = logData.date || new Date().toISOString().split('T')[0];
    const logType = logData.logType || 'FRONTTEST';
    const outcome = logData.result === 'OCCURRED' ? (logData.outcome || null) : null;
    const tvLinks = logData.tvLinks || (logData.tvLink ? [logData.tvLink] : []);
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
      tvLink: tvLinks[0] || undefined,
      // Optional fields
      entryPrice: logData.entryPrice ?? null,
      exitPrice: logData.exitPrice ?? null,
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
      const { data, error } = await supabase
        .from('logs')
        .insert([{
          user_id: user.id,
          edge_id: edgeId,
          result: logData.result,
          outcome,
          log_type: logType,
          day_of_week: logData.dayOfWeek,
          duration_minutes: logData.durationMinutes,
          note: logData.note || '',
          tv_links: tvLinks,
          tv_link: tvLinks[0] || null,
          date: logDate,
          // Optional fields
          entry_price: logData.entryPrice ?? null,
          exit_price: logData.exitPrice ?? null,
          entry_time: logData.entryTime ?? null,
          exit_time: logData.exitTime ?? null,
          daily_open: logData.dailyOpen ?? null,
          daily_high: logData.dailyHigh ?? null,
          daily_low: logData.dailyLow ?? null,
          daily_close: logData.dailyClose ?? null,
          ny_open: logData.nyOpen ?? null,
          position_size: logData.positionSize ?? null,
          direction: logData.direction ?? null,
          symbol: logData.symbol ?? null,
        }])
        .select()
        .single();

      if (error) {
        set({ logs: logs.filter(l => l.id !== tempId), error: `Failed to add log: ${error.message}` });
        toast.error(`Failed to add log: ${error.message}`);
        return;
      }

      if (data) {
        const newLog = mapDbToLog(data);
        set({ logs: get().logs.map(l => l.id === tempId ? newLog : l) });
        toast.success('Trade logged');
      }
    } catch (err) {
      console.error('addLog error:', err);
      set({ logs: logs.filter(l => l.id !== tempId) });
      toast.error('Failed to add log');
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
        set({
          logs: deletedLog ? [...get().logs, deletedLog] : logs,
          error: `Failed to delete log: ${error.message}`,
        });
        toast.error(`Failed to delete log: ${error.message}`);
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

    set({ loadingStates: { ...get().loadingStates, updatingLogId: logId }, error: null });

    const originalLog = logs.find(l => l.id === logId);
    if (!originalLog) {
      toast.error('Log not found');
      set({ loadingStates: { ...get().loadingStates, updatingLogId: null } });
      return;
    }

    try {
      const outcome = logData.result === 'OCCURRED' ? (logData.outcome || null) : null;
      const tvLinks = logData.tvLinks || (logData.tvLink ? [logData.tvLink] : originalLog.tvLinks || []);
      const targetEdgeId = newEdgeId || originalLog.edgeId;

      const updatedLog: TradeLog = {
        ...originalLog,
        ...logData,
        edgeId: targetEdgeId,
        outcome,
        tvLinks,
        tvLink: tvLinks[0] || undefined,
        logType: logData.logType || originalLog.logType,
        date: logData.date || originalLog.date,
        // Optional fields
        entryPrice: logData.entryPrice ?? originalLog.entryPrice ?? null,
        exitPrice: logData.exitPrice ?? originalLog.exitPrice ?? null,
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
      set({ logs: logs.map(l => l.id === logId ? updatedLog : l) });

      const { error } = await supabase
        .from('logs')
        .update({
          edge_id: targetEdgeId,
          result: logData.result,
          outcome,
          log_type: logData.logType || originalLog.logType,
          day_of_week: logData.dayOfWeek,
          duration_minutes: logData.durationMinutes,
          note: logData.note || '',
          tv_links: tvLinks,
          tv_link: tvLinks[0] || null,
          date: logData.date || originalLog.date,
          // Optional fields
          entry_price: logData.entryPrice ?? originalLog.entryPrice ?? null,
          exit_price: logData.exitPrice ?? originalLog.exitPrice ?? null,
          entry_time: logData.entryTime ?? originalLog.entryTime ?? null,
          exit_time: logData.exitTime ?? originalLog.exitTime ?? null,
          daily_open: logData.dailyOpen ?? originalLog.dailyOpen ?? null,
          daily_high: logData.dailyHigh ?? originalLog.dailyHigh ?? null,
          daily_low: logData.dailyLow ?? originalLog.dailyLow ?? null,
          daily_close: logData.dailyClose ?? originalLog.dailyClose ?? null,
          ny_open: logData.nyOpen ?? originalLog.nyOpen ?? null,
          position_size: logData.positionSize ?? originalLog.positionSize ?? null,
          direction: logData.direction ?? originalLog.direction ?? null,
          symbol: logData.symbol ?? originalLog.symbol ?? null,
        })
        .eq('id', logId);

      if (error) {
        set({ logs, error: `Failed to update log: ${error.message}` });
        toast.error(`Failed to update log: ${error.message}`);
        return;
      }

      toast.success('Trade log updated');
    } catch (err) {
      console.error('updateLog error:', err);
      set({ logs });
      toast.error('Failed to update log');
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
        toast.error(`Failed to start MFA enrollment: ${error.message}`);
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
        toast.error(`MFA challenge failed: ${challengeError.message}`);
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
        toast.error(`MFA challenge failed: ${challengeError.message}`);
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
}));
