"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
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
  showAsiaMacros: boolean;

  // Actions
  logMacro: (macroId: string, data: MacroLogInput) => void;
  logMacroForDate: (macroId: string, date: string, data: MacroLogInput) => void;
  updateLog: (logId: string, updates: Partial<MacroLogData & { note: string; tvLinks: string[] }>) => void;
  deleteLog: (logId: string) => void;
  addTvLink: (macroId: string, link: string) => void;
  removeTvLink: (macroId: string, linkIndex: number) => void;
  setShowAsiaMacros: (show: boolean) => void;

  // Queries
  getLogForMacroToday: (macroId: string) => MacroLog | undefined;
  getLogForMacroOnDate: (macroId: string, date: string) => MacroLog | undefined;
  getLogsForDate: (date: string) => MacroLog[];
  getTodaysLogs: () => MacroLog[];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const useMacroStore = create<MacroStore>()(
  persist(
    (set, get) => ({
      logs: [],
      showAsiaMacros: false,

      setShowAsiaMacros: (show) => {
        set({ showAsiaMacros: show });
      },

      logMacro: (macroId, data) => {
        const today = getTodayDate();
        get().logMacroForDate(macroId, today, data);
      },

      logMacroForDate: (macroId, date, data) => {
        const existing = get().logs.find(
          log => log.macroId === macroId && log.date === date
        );

        if (existing) {
          // Update existing log
          set({
            logs: get().logs.map(log =>
              log.id === existing.id
                ? {
                    ...log,
                    pointsMoved: data.pointsMoved ?? log.pointsMoved,
                    direction: data.direction ?? log.direction,
                    displacementQuality: data.displacementQuality ?? log.displacementQuality,
                    liquiditySweep: data.liquiditySweep ?? log.liquiditySweep,
                    note: data.note ?? log.note,
                    tvLinks: data.tvLinks ?? log.tvLinks,
                  }
                : log
            ),
          });
          toast.success('Macro log updated');
        } else {
          // Create new log
          const newLog: MacroLog = {
            id: `macro-${Date.now()}`,
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
          toast.success('Macro logged');
        }
      },

      updateLog: (logId, updates) => {
        set({
          logs: get().logs.map(log =>
            log.id === logId ? { ...log, ...updates } : log
          ),
        });
        toast.success('Log updated');
      },

      deleteLog: (logId) => {
        set({
          logs: get().logs.filter(log => log.id !== logId),
        });
        toast.success('Log deleted');
      },

      addTvLink: (macroId, link) => {
        const today = getTodayDate();
        const existing = get().logs.find(
          log => log.macroId === macroId && log.date === today
        );

        if (existing) {
          set({
            logs: get().logs.map(log =>
              log.id === existing.id
                ? { ...log, tvLinks: [...log.tvLinks, link] }
                : log
            ),
          });
        } else {
          // Create a new log with empty data if none exists
          const newLog: MacroLog = {
            id: `macro-${Date.now()}`,
            macroId,
            date: today,
            pointsMoved: null,
            direction: null,
            displacementQuality: null,
            liquiditySweep: null,
            note: '',
            tvLinks: [link],
            createdAt: new Date().toISOString(),
          };
          set({ logs: [...get().logs, newLog] });
        }
        toast.success('Screenshot link added');
      },

      removeTvLink: (macroId, linkIndex) => {
        const today = getTodayDate();
        const existing = get().logs.find(
          log => log.macroId === macroId && log.date === today
        );

        if (existing) {
          const newLinks = existing.tvLinks.filter((_, i) => i !== linkIndex);
          set({
            logs: get().logs.map(log =>
              log.id === existing.id
                ? { ...log, tvLinks: newLinks }
                : log
            ),
          });
          toast.success('Screenshot link removed');
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
    }),
    {
      name: 'macro-logs-storage',
    }
  )
);
