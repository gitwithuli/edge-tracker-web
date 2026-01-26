/**
 * Edge Store
 * Handles edge CRUD operations
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Edge, EdgeInput } from '@/lib/types';
import { mapEdgeFromDb, type EdgesRow } from '@/lib/database.types';
import { enqueue, dequeue } from '@/lib/request-queue';

interface EdgeLoadingStates {
  fetching: boolean;
  adding: boolean;
  updatingId: string | null;
  deletingId: string | null;
}

interface EdgeStore {
  edges: Edge[];
  loadingStates: EdgeLoadingStates;
  error: string | null;

  // Actions
  fetchEdges: (userId: string) => Promise<void>;
  addEdge: (userId: string, data: EdgeInput) => Promise<string | null>;
  updateEdge: (edgeId: string, data: EdgeInput) => Promise<void>;
  deleteEdge: (edgeId: string) => Promise<void>;
  updateEdgeSharing: (edgeId: string, isPublic: boolean, showTrades?: boolean, showScreenshots?: boolean) => Promise<string | null>;
  clearEdges: () => void;
  setError: (error: string | null) => void;

  // Computed
  getSubEdges: (parentEdgeId: string) => Edge[];
  getParentEdge: (edgeId: string) => Edge | undefined;
  getParentEdges: () => Edge[];
}

const initialLoadingStates: EdgeLoadingStates = {
  fetching: false,
  adding: false,
  updatingId: null,
  deletingId: null,
};

export const useEdgeStoreInternal = create<EdgeStore>((set, get) => ({
  edges: [],
  loadingStates: initialLoadingStates,
  error: null,

  setError: (error) => set({ error }),
  clearEdges: () => set({ edges: [] }),

  getSubEdges: (parentEdgeId) => {
    return get().edges.filter(edge => edge.parentEdgeId === parentEdgeId);
  },

  getParentEdge: (edgeId) => {
    const edge = get().edges.find(e => e.id === edgeId);
    if (!edge?.parentEdgeId) return undefined;
    return get().edges.find(e => e.id === edge.parentEdgeId);
  },

  getParentEdges: () => {
    return get().edges.filter(edge => !edge.parentEdgeId);
  },

  fetchEdges: async (userId) => {
    set({ loadingStates: { ...get().loadingStates, fetching: true }, error: null });

    const { data, error } = await supabase
      .from('edges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      const message = `Failed to fetch edges: ${error.message}`;
      set({ error: message, loadingStates: { ...get().loadingStates, fetching: false } });
      toast.error(message);
      return;
    }

    set({
      edges: (data || []).map(row => mapEdgeFromDb(row as EdgesRow)),
      loadingStates: { ...get().loadingStates, fetching: false }
    });
  },

  addEdge: async (userId, data) => {
    set({ loadingStates: { ...get().loadingStates, adding: true }, error: null });

    const queueId = enqueue({ type: 'addEdge', payload: { data } });

    try {
      const { data: newEdge, error } = await supabase
        .from('edges')
        .insert([{
          user_id: userId,
          name: data.name,
          description: data.description || '',
          enabled_fields: data.enabledFields || [],
          symbol: data.symbol || null,
          parent_edge_id: data.parentEdgeId || null,
        }])
        .select()
        .single();

      if (error) {
        dequeue(queueId);
        set({ error: `Failed to create edge: ${error.message}` });
        toast.error(`Failed to create edge: ${error.message}`);
        return null;
      }

      if (!newEdge) {
        dequeue(queueId);
        set({ error: 'Failed to create edge - no data returned' });
        toast.error('Failed to create edge. Please try again.');
        return null;
      }

      dequeue(queueId);
      set({ edges: [...get().edges, mapEdgeFromDb(newEdge as EdgesRow)] });
      toast.success('Edge created successfully');
      return newEdge.id as string;
    } catch (err) {
      console.error('addEdge error:', err);
      toast.error('Save pending - keep this tab active or return later');
      return null;
    } finally {
      set({ loadingStates: { ...get().loadingStates, adding: false } });
    }
  },

  updateEdge: async (edgeId, data) => {
    const { edges } = get();
    set({ loadingStates: { ...get().loadingStates, updatingId: edgeId }, error: null });

    const originalEdge = edges.find(e => e.id === edgeId);
    if (!originalEdge) {
      toast.error('Edge not found');
      set({ loadingStates: { ...get().loadingStates, updatingId: null } });
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
      set({ loadingStates: { ...get().loadingStates, updatingId: null } });
    }
  },

  deleteEdge: async (edgeId) => {
    const { edges } = get();
    set({ loadingStates: { ...get().loadingStates, deletingId: edgeId }, error: null });

    // Get sub-edges that will be cascade deleted
    const subEdgeIds = edges.filter(e => e.parentEdgeId === edgeId).map(e => e.id);
    const allDeletedEdgeIds = [edgeId, ...subEdgeIds];
    const deletedEdges = edges.filter(e => allDeletedEdgeIds.includes(e.id));

    set({ edges: edges.filter(e => !allDeletedEdgeIds.includes(e.id)) });

    try {
      const { error } = await supabase.from('edges').delete().eq('id', edgeId);

      if (error) {
        set({ edges: [...get().edges, ...deletedEdges], error: `Failed to delete edge: ${error.message}` });
        toast.error(`Failed to delete edge: ${error.message}`);
        return;
      }

      toast.success('Edge deleted');
    } catch (err) {
      console.error('deleteEdge error:', err);
      set({ edges: [...get().edges, ...deletedEdges] });
      toast.error('Failed to delete edge');
    } finally {
      set({ loadingStates: { ...get().loadingStates, deletingId: null } });
    }
  },

  updateEdgeSharing: async (edgeId, isPublic, showTrades = true, showScreenshots = true) => {
    const { edges } = get();
    set({ loadingStates: { ...get().loadingStates, updatingId: edgeId }, error: null });

    const originalEdge = edges.find(e => e.id === edgeId);
    if (!originalEdge) {
      toast.error('Edge not found');
      set({ loadingStates: { ...get().loadingStates, updatingId: null } });
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
        set({ error: `Failed to update sharing: ${error.message}` });
        toast.error(`Failed to update sharing: ${error.message}`);
        return null;
      }

      const updatedEdge = mapEdgeFromDb(data as EdgesRow);
      set({ edges: edges.map(e => e.id === edgeId ? updatedEdge : e) });

      toast.success(isPublic ? 'Edge is now public' : 'Edge is now private');
      return updatedEdge.publicSlug || null;
    } catch (err) {
      console.error('updateEdgeSharing error:', err);
      toast.error('Failed to update sharing');
      return null;
    } finally {
      set({ loadingStates: { ...get().loadingStates, updatingId: null } });
    }
  },
}));
