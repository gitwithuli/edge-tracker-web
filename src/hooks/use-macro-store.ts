"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type {
  MacroDirection,
  DisplacementQuality,
  LiquiditySweep,
  MacroLogData,
} from '@/lib/macro-constants';

export type { MacroDirection, DisplacementQuality, LiquiditySweep };

export interface MacroLog {
  id: string;
  macroId: string;
  date: string; // YYYY-MM-DD
  pointsMoved: number | null;
  direction: MacroDirection | null;
  displacementQuality: DisplacementQuality | null;
  liquiditySweep: LiquiditySweep | null;
  note: string;
  tvLinks: string[];
  createdAt: string;
}

export type MacroLogInput = Partial<MacroLogData> & {
  note?: string;
  tvLinks?: string[];
};

interface MacroStore {
  logs: MacroLog[];
  isLoaded: boolean;
  showAsiaMacros: boolean;
  showLondonMacros: boolean;
  showNYMacros: boolean;

  // Actions
  fetchLogs: () => Promise<void>;
  logMacro: (macroId: string, data: MacroLogInput) => Promise<void>;
  logMacroForDate: (macroId: string, date: string, data: MacroLogInput) => Promise<void>;
  updateLog: (logId: string, updates: Partial<MacroLogData & { note: string; tvLinks: string[] }>) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  addTvLink: (macroId: string, link: string) => Promise<void>;
  removeTvLink: (macroId: string, linkIndex: number) => Promise<void>;
  setShowAsiaMacros: (show: boolean) => void;
  setShowLondonMacros: (show: boolean) => void;
  setShowNYMacros: (show: boolean) => void;
  migrateFromLocalStorage: () => Promise<void>;

  // Queries
  getLogForMacroToday: (macroId: string) => MacroLog | undefined;
  getLogForMacroOnDate: (macroId: string, date: string) => MacroLog | undefined;
  getLogsForDate: (date: string) => MacroLog[];
  getTodaysLogs: () => MacroLog[];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Map database row to MacroLog type
function mapDbToMacroLog(row: Record<string, unknown>): MacroLog {
  return {
    id: row.id as string,
    macroId: row.macro_id as string,
    date: row.date as string,
    pointsMoved: row.points_moved as number | null,
    direction: row.direction as MacroDirection | null,
    displacementQuality: row.displacement_quality as DisplacementQuality | null,
    liquiditySweep: row.liquidity_sweep as LiquiditySweep | null,
    note: (row.note as string) || '',
    tvLinks: (row.tv_links as string[]) || [],
    createdAt: row.created_at as string,
  };
}

// UI preferences store (kept in localStorage)
interface MacroPreferences {
  showAsiaMacros: boolean;
  showLondonMacros: boolean;
  showNYMacros: boolean;
}

const usePreferencesStore = create<MacroPreferences>()(
  persist(
    (): MacroPreferences => ({
      showAsiaMacros: false,
      showLondonMacros: true,
      showNYMacros: true,
    }),
    { name: 'macro-preferences' }
  )
);

export const useMacroStore = create<MacroStore>()((set, get) => ({
  logs: [],
  isLoaded: false,
  showAsiaMacros: usePreferencesStore.getState().showAsiaMacros,
  showLondonMacros: usePreferencesStore.getState().showLondonMacros,
  showNYMacros: usePreferencesStore.getState().showNYMacros,

  setShowAsiaMacros: (show) => {
    set({ showAsiaMacros: show });
    usePreferencesStore.setState({ showAsiaMacros: show });
  },

  setShowLondonMacros: (show) => {
    set({ showLondonMacros: show });
    usePreferencesStore.setState({ showLondonMacros: show });
  },

  setShowNYMacros: (show) => {
    set({ showNYMacros: show });
    usePreferencesStore.setState({ showNYMacros: show });
  },

  fetchLogs: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ logs: [], isLoaded: true });
      return;
    }

    try {
      // Fetch last 90 days of logs to prevent loading entire history
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('macro_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', dateFilter)
        .order('date', { ascending: false })
        .limit(1000); // Safety limit

      if (error) {
        console.error('Failed to fetch macro logs:', error.message);
        toast.error('Failed to load macro data');
        set({ isLoaded: true });
        return;
      }

      const logs = (data || []).map(mapDbToMacroLog);
      set({ logs, isLoaded: true });

      // Try to migrate localStorage data after initial fetch
      await get().migrateFromLocalStorage();
    } catch (err) {
      console.error('fetchLogs error:', err);
      set({ isLoaded: true });
    }
  },

  migrateFromLocalStorage: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if we have localStorage data to migrate
    const localStorageKey = 'macro-logs-storage';
    const stored = localStorage.getItem(localStorageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const localLogs = parsed?.state?.logs as MacroLog[] | undefined;

      if (!localLogs || localLogs.length === 0) {
        localStorage.removeItem(localStorageKey);
        return;
      }

      // Get existing logs to avoid duplicates
      const existingLogs = get().logs;
      const existingKeys = new Set(
        existingLogs.map(l => `${l.macroId}-${l.date}`)
      );

      // Filter out logs that already exist
      const logsToMigrate = localLogs.filter(
        l => !existingKeys.has(`${l.macroId}-${l.date}`)
      );

      if (logsToMigrate.length === 0) {
        localStorage.removeItem(localStorageKey);
        return;
      }

      // Insert migrated logs
      const insertData = logsToMigrate.map(log => ({
        user_id: user.id,
        macro_id: log.macroId,
        date: log.date,
        points_moved: log.pointsMoved,
        direction: log.direction,
        displacement_quality: log.displacementQuality,
        liquidity_sweep: log.liquiditySweep,
        note: log.note || '',
        tv_links: log.tvLinks || [],
      }));

      const { data, error } = await supabase
        .from('macro_logs')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Failed to migrate macro logs:', error.message);
        return;
      }

      if (data) {
        const migratedLogs = data.map(mapDbToMacroLog);
        set({ logs: [...get().logs, ...migratedLogs] });
        toast.success(`Migrated ${migratedLogs.length} macro logs from local storage`);
      }

      // Remove localStorage after successful migration
      localStorage.removeItem(localStorageKey);
    } catch (err) {
      console.error('Migration error:', err);
    }
  },

  logMacro: async (macroId, data) => {
    const today = getTodayDate();
    await get().logMacroForDate(macroId, today, data);
  },

  logMacroForDate: async (macroId, date, data) => {
    // Check for existing log locally first (before any async)
    const existing = get().logs.find(
      log => log.macroId === macroId && log.date === date
    );

    if (existing) {
      // Check if this log is still being created (has temp ID)
      const isTempLog = existing.id.startsWith('temp-');

      // Update existing log - optimistic update FIRST
      const updates = {
        pointsMoved: data.pointsMoved ?? existing.pointsMoved,
        direction: data.direction ?? existing.direction,
        displacementQuality: data.displacementQuality ?? existing.displacementQuality,
        liquiditySweep: data.liquiditySweep ?? existing.liquiditySweep,
        note: data.note ?? existing.note,
        tvLinks: data.tvLinks ?? existing.tvLinks,
      };

      set({
        logs: get().logs.map(log =>
          log.id === existing.id ? { ...log, ...updates } : log
        ),
      });

      // If this is a temp log, the insert is still in progress
      // Just update local state and let the original insert complete
      // The user can update again once the log is saved
      if (isTempLog) {
        // Don't show error - the local state is updated, just skip the DB update
        // The original insert will save the initial data
        return;
      }

      // Now do async auth check and server update
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to log macros');
        await get().fetchLogs();
        return;
      }

      const { error } = await supabase
        .from('macro_logs')
        .update({
          points_moved: updates.pointsMoved,
          direction: updates.direction,
          displacement_quality: updates.displacementQuality,
          liquidity_sweep: updates.liquiditySweep,
          note: updates.note,
          tv_links: updates.tvLinks,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Failed to update macro log:', error.message);
        toast.error('Failed to update macro log');
        await get().fetchLogs();
        return;
      }

      toast.success('Macro log updated');
    } else {
      // Create new log - optimistic update FIRST (before any async)
      const tempId = `temp-${Date.now()}`;
      const newLog: MacroLog = {
        id: tempId,
        macroId,
        date,
        pointsMoved: data.pointsMoved ?? null,
        direction: data.direction ?? null,
        displacementQuality: data.displacementQuality ?? null,
        liquiditySweep: data.liquiditySweep ?? null,
        note: data.note ?? '',
        tvLinks: data.tvLinks ?? [],
        createdAt: new Date().toISOString(),
      };

      set({ logs: [...get().logs, newLog] });

      // Now do async auth check and server insert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to log macros');
        set({ logs: get().logs.filter(l => l.id !== tempId) });
        return;
      }

      // Get the latest state of the temp log (may have been updated while we awaited auth)
      const currentLog = get().logs.find(l => l.id === tempId);
      if (!currentLog) {
        // Log was removed, nothing to save
        return;
      }

      const { data: insertedData, error } = await supabase
        .from('macro_logs')
        .insert({
          user_id: user.id,
          macro_id: macroId,
          date,
          points_moved: currentLog.pointsMoved,
          direction: currentLog.direction,
          displacement_quality: currentLog.displacementQuality,
          liquidity_sweep: currentLog.liquiditySweep,
          note: currentLog.note,
          tv_links: currentLog.tvLinks,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create macro log:', error.message);
        toast.error('Failed to log macro');
        set({ logs: get().logs.filter(l => l.id !== tempId) });
        return;
      }

      if (insertedData) {
        const savedLog = mapDbToMacroLog(insertedData);
        set({ logs: get().logs.map(l => l.id === tempId ? savedLog : l) });
      }

      toast.success('Macro logged');
    }
  },

  updateLog: async (logId, updates) => {
    const originalLogs = get().logs;
    const log = originalLogs.find(l => l.id === logId);
    if (!log) return;

    // Optimistic update
    set({
      logs: originalLogs.map(l =>
        l.id === logId ? { ...l, ...updates } : l
      ),
    });

    const { error } = await supabase
      .from('macro_logs')
      .update({
        points_moved: updates.pointsMoved,
        direction: updates.direction,
        displacement_quality: updates.displacementQuality,
        liquidity_sweep: updates.liquiditySweep,
        note: updates.note,
        tv_links: updates.tvLinks,
      })
      .eq('id', logId);

    if (error) {
      console.error('Failed to update macro log:', error.message);
      toast.error('Failed to update log');
      set({ logs: originalLogs });
      return;
    }

    toast.success('Log updated');
  },

  deleteLog: async (logId) => {
    const originalLogs = get().logs;

    // Optimistic delete
    set({ logs: originalLogs.filter(log => log.id !== logId) });

    const { error } = await supabase
      .from('macro_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Failed to delete macro log:', error.message);
      toast.error('Failed to delete log');
      set({ logs: originalLogs });
      return;
    }

    toast.success('Log deleted');
  },

  addTvLink: async (macroId, link) => {
    const today = getTodayDate();
    const existing = get().logs.find(
      log => log.macroId === macroId && log.date === today
    );

    if (existing) {
      const newLinks = [...existing.tvLinks, link];
      await get().updateLog(existing.id, { tvLinks: newLinks });
    } else {
      await get().logMacroForDate(macroId, today, { tvLinks: [link] });
    }
  },

  removeTvLink: async (macroId, linkIndex) => {
    const today = getTodayDate();
    const existing = get().logs.find(
      log => log.macroId === macroId && log.date === today
    );

    if (existing) {
      const newLinks = existing.tvLinks.filter((_, i) => i !== linkIndex);
      await get().updateLog(existing.id, { tvLinks: newLinks });
    }
  },

  getLogForMacroToday: (macroId) => {
    const today = getTodayDate();
    return get().logs.find(
      log => log.macroId === macroId && log.date === today
    );
  },

  getLogForMacroOnDate: (macroId, date) => {
    return get().logs.find(
      log => log.macroId === macroId && log.date === date
    );
  },

  getLogsForDate: (date) => {
    return get().logs.filter(log => log.date === date);
  },

  getTodaysLogs: () => {
    const today = getTodayDate();
    return get().logs.filter(log => log.date === today);
  },
}));
