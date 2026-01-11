import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Edge, TradeLog, TradeLogInput } from '@/lib/types';

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

  fetchEdges: async () => {
    set({ loadingStates: { ...get().loadingStates, fetchingEdges: true }, error: null });

    const { data, error } = await supabase.from('edges').select('*');

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

    if (data) {
      const formattedLogs: TradeLog[] = data.map((log) => ({
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
        tv_link: logData.tvLink || null,
        date: new Date().toISOString()
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
      const newLog: TradeLog = { ...data, tvLink: data.tv_link };
      set({
        logs: get().logs.map(l => l.id === tempId ? newLog : l),
        loadingStates: { ...get().loadingStates, addingLog: false }
      });
      toast.success('Trade logged successfully');
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
        logs: deletedLog ? [...logs] : logs,
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

    const updatedLog: TradeLog = {
      ...originalLog,
      ...logData
    };

    set({ logs: logs.map(l => l.id === logId ? updatedLog : l) });

    const { error } = await supabase
      .from('logs')
      .update({ ...logData, tv_link: logData.tvLink || null })
      .eq('id', logId);

    if (error) {
      const message = `Failed to update log: ${error.message}`;
      set({
        logs: logs,
        error: message,
        loadingStates: { ...get().loadingStates, updatingLogId: null }
      });
      toast.error(message);
      return;
    }

    set({ loadingStates: { ...get().loadingStates, updatingLogId: null } });
    toast.success('Trade log updated');
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, logs: [], edges: [], error: null });
    window.location.href = '/';
  }
}));
