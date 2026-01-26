/**
 * Log Store
 * Handles trade log CRUD operations
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { TradeLog, TradeLogInput } from '@/lib/types';
import { mapLogFromDb, type LogsRow } from '@/lib/database.types';
import { enqueue, dequeue } from '@/lib/request-queue';

interface LogLoadingStates {
  fetching: boolean;
  adding: boolean;
  updatingId: string | null;
  deletingId: string | null;
}

interface LogStore {
  logs: TradeLog[];
  loadingStates: LogLoadingStates;
  error: string | null;

  // Actions
  fetchLogs: (userId: string) => Promise<void>;
  addLog: (userId: string, edgeId: string, logData: TradeLogInput) => Promise<void>;
  updateLog: (logId: string, logData: TradeLogInput, newEdgeId?: string) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  clearLogs: () => void;
  setError: (error: string | null) => void;
  removeTempLogs: () => void;

  // Computed
  getLogsByEdge: (edgeId: string) => TradeLog[];
}

const initialLoadingStates: LogLoadingStates = {
  fetching: false,
  adding: false,
  updatingId: null,
  deletingId: null,
};

export const useLogStoreInternal = create<LogStore>((set, get) => ({
  logs: [],
  loadingStates: initialLoadingStates,
  error: null,

  setError: (error) => set({ error }),
  clearLogs: () => set({ logs: [] }),
  removeTempLogs: () => set({ logs: get().logs.filter(l => !l.id.startsWith('temp-')) }),

  getLogsByEdge: (edgeId) => {
    return get().logs.filter(log => log.edgeId === edgeId);
  },

  fetchLogs: async (userId) => {
    set({ loadingStates: { ...get().loadingStates, fetching: true }, error: null });

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      const message = `Failed to fetch logs: ${error.message}`;
      set({ error: message, loadingStates: { ...get().loadingStates, fetching: false } });
      toast.error(message);
      return;
    }

    set({
      logs: (data || []).map(row => mapLogFromDb(row as LogsRow)),
      loadingStates: { ...get().loadingStates, fetching: false }
    });
  },

  addLog: async (userId, edgeId, logData) => {
    const { logs } = get();
    set({ loadingStates: { ...get().loadingStates, adding: true }, error: null });

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
      const { data, error } = await supabase
        .from('logs')
        .insert([{
          user_id: userId,
          edge_id: edgeId,
          result: logData.result,
          outcome,
          log_type: logType,
          day_of_week: logData.dayOfWeek,
          duration_minutes: logData.durationMinutes,
          note: logData.note || '',
          tv_links: tvLinks,
          date: logDate,
          entry_price: logData.entryPrice ?? null,
          exit_price: logData.exitPrice ?? null,
          stop_loss: logData.stopLoss ?? null,
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
        dequeue(queueId);
        set({ logs: logs.filter(l => l.id !== tempId), error: `Failed to add log: ${error.message}` });
        toast.error(`Failed to add log: ${error.message}`);
        return;
      }

      if (!data) {
        dequeue(queueId);
        set({ logs: logs.filter(l => l.id !== tempId), error: 'Failed to save log - no data returned' });
        toast.error('Failed to save log. Please try again.');
        return;
      }

      dequeue(queueId);
      const newLog = mapLogFromDb(data as LogsRow);
      set({ logs: get().logs.map(l => l.id === tempId ? newLog : l) });
      toast.success('Trade logged');
    } catch (err) {
      console.error('addLog error:', err);
      toast.error('Save pending - will retry when connection restored', {
        duration: 5000,
        description: 'Keep this tab open or return later',
      });
    } finally {
      set({ loadingStates: { ...get().loadingStates, adding: false } });
    }
  },

  updateLog: async (logId, logData, newEdgeId) => {
    const { logs } = get();

    if (logId.startsWith('temp-')) {
      toast.error('Please wait for the log to finish saving before editing');
      return;
    }

    set({ loadingStates: { ...get().loadingStates, updatingId: logId }, error: null });

    const originalLog = logs.find(l => l.id === logId);
    if (!originalLog) {
      toast.error('Log not found');
      set({ loadingStates: { ...get().loadingStates, updatingId: null } });
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

    // Optimistic update
    set({ logs: logs.map(l => l.id === logId ? updatedLog : l) });

    try {
      const { data, error } = await supabase
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
          date: logData.date || originalLog.date,
          entry_price: logData.entryPrice ?? originalLog.entryPrice ?? null,
          exit_price: logData.exitPrice ?? originalLog.exitPrice ?? null,
          stop_loss: logData.stopLoss ?? originalLog.stopLoss ?? null,
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
        .eq('id', logId)
        .select()
        .single();

      if (error) {
        set({ logs, error: `Failed to update log: ${error.message}` });
        toast.error(`Failed to update log: ${error.message}`);
        return;
      }

      if (!data) {
        set({ logs, error: 'Update failed - log not found in database' });
        toast.error('Update failed - log not found. Please refresh the page.');
        return;
      }

      const confirmedLog = mapLogFromDb(data as LogsRow);
      set({ logs: get().logs.map(l => l.id === logId ? confirmedLog : l) });
      toast.success('Trade log updated');
    } catch (err) {
      console.error('updateLog error:', err);
      toast.error('Update pending - will retry when connection restored', {
        duration: 5000,
        description: 'Keep this tab open or return later',
      });
    } finally {
      set({ loadingStates: { ...get().loadingStates, updatingId: null } });
    }
  },

  deleteLog: async (logId) => {
    const { logs } = get();
    set({ loadingStates: { ...get().loadingStates, deletingId: logId }, error: null });

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
      set({ loadingStates: { ...get().loadingStates, deletingId: null } });
    }
  },
}));
