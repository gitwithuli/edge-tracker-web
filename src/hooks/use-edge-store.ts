import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Edge, TradeLog, TradeLogInput } from '@/lib/types';

interface LoadingStates {
  fetchingEdges: boolean;
  fetchingLogs: boolean;
  addingLog: boolean;
  deletingLogId: string | number | null;
  updatingLogId: string | number | null;
}

interface EdgeStore {
  edges: Edge[];
  logs: TradeLog[];
  user: User | null;
  isLoaded: boolean;
  error: string | null;
  loadingStates: LoadingStates;

  setEdges: (edges: Edge[]) => void;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  initializeAuth: () => Promise<void>;
  fetchEdges: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  addLog: (edgeId: string, logData: TradeLogInput) => Promise<void>;
  deleteLog: (logId: string | number) => Promise<void>;
  updateLog: (logId: string | number, logData: TradeLogInput) => Promise<void>;
  logout: () => Promise<void>;
}

const initialLoadingStates: LoadingStates = {
  fetchingEdges: false,
  fetchingLogs: false,
  addingLog: false,
  deletingLogId: null,
  updatingLogId: null,
};

export const useEdgeStore = create<EdgeStore>((set, get) => ({
  edges: [],
  logs: [],
  user: null,
  isLoaded: false,
  error: null,
  loadingStates: initialLoadingStates,

  setEdges: (edges) => set({ edges }),
  setUser: (user) => set({ user, isLoaded: true }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  initializeAuth: async () => {
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
  },

  fetchEdges: async () => {
    set({ loadingStates: { ...get().loadingStates, fetchingEdges: true }, error: null });

    const { data, error } = await supabase.from('edges').select('*');

    if (error) {
      set({
        error: `Failed to fetch edges: ${error.message}`,
        loadingStates: { ...get().loadingStates, fetchingEdges: false }
      });
      return;
    }

    set({
      edges: data || [],
      loadingStates: { ...get().loadingStates, fetchingEdges: false }
    });
  },

  fetchLogs: async () => {
    const { user } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, fetchingLogs: true }, error: null });

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      set({
        error: `Failed to fetch logs: ${error.message}`,
        loadingStates: { ...get().loadingStates, fetchingLogs: false }
      });
      return;
    }

    if (data) {
      const formattedLogs = data.map((log) => ({
        ...log,
        tvLink: log.tv_link,
      }));
      set({
        logs: formattedLogs,
        loadingStates: { ...get().loadingStates, fetchingLogs: false }
      });
    }
  },

  addLog: async (edgeId, logData) => {
    const { user, logs } = get();
    if (!user) return;

    set({ loadingStates: { ...get().loadingStates, addingLog: true }, error: null });

    const tempId = `temp-${Date.now()}`;
    const optimisticLog: TradeLog = {
      id: tempId,
      date: new Date().toISOString(),
      ...logData,
    };

    set({ logs: [optimisticLog, ...logs] });

    const { data, error } = await supabase
      .from('logs')
      .insert([{
        ...logData,
        edge_id: edgeId,
        user_id: user.id,
        tv_link: logData.tvLink,
        date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      set({
        logs: logs.filter(l => l.id !== tempId),
        error: `Failed to add log: ${error.message}`,
        loadingStates: { ...get().loadingStates, addingLog: false }
      });
      return;
    }

    if (data) {
      const newLog: TradeLog = { ...data, tvLink: data.tv_link };
      set({
        logs: get().logs.map(l => l.id === tempId ? newLog : l),
        loadingStates: { ...get().loadingStates, addingLog: false }
      });
    }
  },

  deleteLog: async (logId) => {
    const { logs } = get();

    set({ loadingStates: { ...get().loadingStates, deletingLogId: logId }, error: null });

    const deletedLog = logs.find(l => l.id === logId);
    set({ logs: logs.filter(l => l.id !== logId) });

    const { error } = await supabase.from('logs').delete().eq('id', logId);

    if (error) {
      set({
        logs: deletedLog ? [...logs] : logs,
        error: `Failed to delete log: ${error.message}`,
        loadingStates: { ...get().loadingStates, deletingLogId: null }
      });
      return;
    }

    set({ loadingStates: { ...get().loadingStates, deletingLogId: null } });
  },

  updateLog: async (logId, logData) => {
    const { logs } = get();

    set({ loadingStates: { ...get().loadingStates, updatingLogId: logId }, error: null });

    const originalLog = logs.find(l => l.id === logId);
    const updatedLog: TradeLog = {
      ...originalLog!,
      ...logData
    };

    set({ logs: logs.map(l => l.id === logId ? updatedLog : l) });

    const { error } = await supabase
      .from('logs')
      .update({ ...logData, tv_link: logData.tvLink })
      .eq('id', logId);

    if (error) {
      set({
        logs: originalLog ? logs : get().logs,
        error: `Failed to update log: ${error.message}`,
        loadingStates: { ...get().loadingStates, updatingLogId: null }
      });
      return;
    }

    set({ loadingStates: { ...get().loadingStates, updatingLogId: null } });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, logs: [], edges: [], error: null });
    window.location.href = '/';
  }
}));
