import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Edge, EdgeInput, TradeLog, TradeLogInput, EdgeWithLogs } from '@/lib/types';

interface LoadingStates {
  fetchingEdges: boolean;
  fetchingLogs: boolean;
  addingEdge: boolean;
  updatingEdgeId: string | null;
  deletingEdgeId: string | null;
  addingLog: boolean;
  deletingLogId: string | null;
  updatingLogId: string | null;
}

interface EdgeStore {
  edges: Edge[];
  logs: TradeLog[];
  user: User | null;
  isLoaded: boolean;
  error: string | null;
  loadingStates: LoadingStates;

  // Computed
  getEdgesWithLogs: () => EdgeWithLogs[];
  getLogsByEdge: (edgeId: string) => TradeLog[];

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
  updateLog: (logId: string, logData: TradeLogInput) => Promise<void>;
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
};

// Map database row to Edge type
function mapDbToEdge(row: Record<string, unknown>): Edge {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Map database row to TradeLog type
function mapDbToLog(row: Record<string, unknown>): TradeLog {
  return {
    id: row.id as string,
    edgeId: row.edge_id as string,
    result: row.result as TradeLog['result'],
    dayOfWeek: row.day_of_week as TradeLog['dayOfWeek'],
    durationMinutes: row.duration_minutes as number,
    note: (row.note as string) || '',
    tvLink: (row.tv_link as string) || undefined,
    date: row.date as string,
  };
}

export const useEdgeStore = create<EdgeStore>((set, get) => ({
  edges: [],
  logs: [],
  user: null,
  isLoaded: false,
  error: null,
  loadingStates: initialLoadingStates,

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

  setUser: (user) => set({ user, isLoaded: true }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user, isLoaded: true });
        await get().fetchEdges();
        await get().fetchLogs();
      } else {
        set({ isLoaded: true });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          set({ user: session.user });
          await get().fetchEdges();
          await get().fetchLogs();
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, logs: [], edges: [] });
        }
      });
    } catch (err) {
      console.error('Auth initialization failed:', err);
      set({ isLoaded: true });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, logs: [], edges: [], error: null });
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

    const { data: newEdge, error } = await supabase
      .from('edges')
      .insert([{
        user_id: user.id,
        name: data.name,
        description: data.description || '',
      }])
      .select()
      .single();

    if (error) {
      const message = `Failed to create edge: ${error.message}`;
      set({
        error: message,
        loadingStates: { ...get().loadingStates, addingEdge: false }
      });
      toast.error(message);
      return null;
    }

    if (newEdge) {
      set({
        edges: [...get().edges, mapDbToEdge(newEdge)],
        loadingStates: { ...get().loadingStates, addingEdge: false }
      });
      toast.success('Edge created successfully');
      return newEdge.id as string;
    }

    set({ loadingStates: { ...get().loadingStates, addingEdge: false } });
    return null;
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

    // Optimistic update
    const updatedEdge: Edge = { ...originalEdge, ...data };
    set({ edges: edges.map(e => e.id === edgeId ? updatedEdge : e) });

    const { error } = await supabase
      .from('edges')
      .update({
        name: data.name,
        description: data.description || '',
      })
      .eq('id', edgeId);

    if (error) {
      const message = `Failed to update edge: ${error.message}`;
      set({
        edges, // Rollback
        error: message,
        loadingStates: { ...get().loadingStates, updatingEdgeId: null }
      });
      toast.error(message);
      return;
    }

    set({ loadingStates: { ...get().loadingStates, updatingEdgeId: null } });
    toast.success('Edge updated');
  },

  deleteEdge: async (edgeId) => {
    const { edges, logs } = get();

    set({ loadingStates: { ...get().loadingStates, deletingEdgeId: edgeId }, error: null });

    const deletedEdge = edges.find(e => e.id === edgeId);
    const deletedLogs = logs.filter(l => l.edgeId === edgeId);

    // Optimistic delete
    set({
      edges: edges.filter(e => e.id !== edgeId),
      logs: logs.filter(l => l.edgeId !== edgeId),
    });

    const { error } = await supabase.from('edges').delete().eq('id', edgeId);

    if (error) {
      const message = `Failed to delete edge: ${error.message}`;
      set({
        edges: deletedEdge ? [...get().edges, deletedEdge] : get().edges, // Rollback
        logs: [...get().logs, ...deletedLogs],
        error: message,
        loadingStates: { ...get().loadingStates, deletingEdgeId: null }
      });
      toast.error(message);
      return;
    }

    set({ loadingStates: { ...get().loadingStates, deletingEdgeId: null } });
    toast.success('Edge deleted');
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
    const today = new Date().toISOString().split('T')[0];
    const optimisticLog: TradeLog = {
      id: tempId,
      edgeId,
      date: today,
      ...logData,
    };

    set({ logs: [optimisticLog, ...logs] });

    const { data, error } = await supabase
      .from('logs')
      .insert([{
        user_id: user.id,
        edge_id: edgeId,
        result: logData.result,
        day_of_week: logData.dayOfWeek,
        duration_minutes: logData.durationMinutes,
        note: logData.note || '',
        tv_link: logData.tvLink || null,
        date: today,
      }])
      .select()
      .single();

    if (error) {
      const message = `Failed to add log: ${error.message}`;
      set({
        logs: logs.filter(l => l.id !== tempId),
        error: message,
        loadingStates: { ...get().loadingStates, addingLog: false }
      });
      toast.error(message);
      return;
    }

    if (data) {
      const newLog = mapDbToLog(data);
      set({
        logs: get().logs.map(l => l.id === tempId ? newLog : l),
        loadingStates: { ...get().loadingStates, addingLog: false }
      });
      toast.success('Trade logged');
    }
  },

  deleteLog: async (logId) => {
    const { logs } = get();

    set({ loadingStates: { ...get().loadingStates, deletingLogId: logId }, error: null });

    const deletedLog = logs.find(l => l.id === logId);
    set({ logs: logs.filter(l => l.id !== logId) });

    const { error } = await supabase.from('logs').delete().eq('id', logId);

    if (error) {
      const message = `Failed to delete log: ${error.message}`;
      set({
        logs: deletedLog ? [...get().logs, deletedLog] : logs,
        error: message,
        loadingStates: { ...get().loadingStates, deletingLogId: null }
      });
      toast.error(message);
      return;
    }

    set({ loadingStates: { ...get().loadingStates, deletingLogId: null } });
    toast.success('Trade log deleted');
  },

  updateLog: async (logId, logData) => {
    const { logs } = get();

    set({ loadingStates: { ...get().loadingStates, updatingLogId: logId }, error: null });

    const originalLog = logs.find(l => l.id === logId);
    if (!originalLog) {
      toast.error('Log not found');
      set({ loadingStates: { ...get().loadingStates, updatingLogId: null } });
      return;
    }

    const updatedLog: TradeLog = { ...originalLog, ...logData };
    set({ logs: logs.map(l => l.id === logId ? updatedLog : l) });

    const { error } = await supabase
      .from('logs')
      .update({
        result: logData.result,
        day_of_week: logData.dayOfWeek,
        duration_minutes: logData.durationMinutes,
        note: logData.note || '',
        tv_link: logData.tvLink || null,
      })
      .eq('id', logId);

    if (error) {
      const message = `Failed to update log: ${error.message}`;
      set({
        logs,
        error: message,
        loadingStates: { ...get().loadingStates, updatingLogId: null }
      });
      toast.error(message);
      return;
    }

    set({ loadingStates: { ...get().loadingStates, updatingLogId: null } });
    toast.success('Trade log updated');
  },
}));
