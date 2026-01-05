import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Edge, Log } from '@/lib/types';

interface EdgeStore {
  edges: Edge[];
  logs: Log[];
  user: any;
  isLoaded: boolean;
  setEdges: (edges: Edge[]) => void;
  setUser: (user: any) => void;
  fetchEdges: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  addLog: (edgeId: string, logData: any) => Promise<void>;
  deleteLog: (logId: string | number) => Promise<void>;
  updateLog: (logId: string, logData: any) => Promise<void>;
  logout: () => Promise<void>; // 👈 EKSİK OLAN TANIMLAMA
}

export const useEdgeStore = create<EdgeStore>((set, get) => ({
  edges: [],
  logs: [],
  user: null,
  isLoaded: false,

  setEdges: (edges) => set({ edges }),
  setUser: (user) => set({ user, isLoaded: true }),

  fetchEdges: async () => {
    const { data } = await supabase.from('edges').select('*');
    if (data) set({ edges: data });
  },

  fetchLogs: async () => {
    const { user } = get();
    if (!user) return;

    const { data } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      // KRİTİK: tv_link verisini tvLink olarak eşliyoruz (Render Sorunu Çözümü)
      const formattedLogs = data.map((log) => ({
        ...log,
        tvLink: log.tv_link, 
      }));
      set({ logs: formattedLogs });
    }
  },

  addLog: async (edgeId, logData) => {
    const { user } = get();
    if (!user) return;

    const { data } = await supabase
      .from('logs')
      .insert([{ ...logData, edge_id: edgeId, user_id: user.id, tv_link: logData.tvLink }])
      .select();

    if (data) await get().fetchLogs();
  },

  deleteLog: async (logId) => {
    const { error } = await supabase.from('logs').delete().eq('id', logId);
    if (!error) await get().fetchLogs();
  },

  updateLog: async (logId, logData) => {
    const { error } = await supabase
      .from('logs')
      .update({ ...logData, tv_link: logData.tvLink })
      .eq('id', logId);
    if (!error) await get().fetchLogs();
  },

  // 👈 LOGOUT FONKSİYONU
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, logs: [], edges: [] });
    window.location.href = '/';
  }
}));