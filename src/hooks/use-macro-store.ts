"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { MacroOutcome } from '@/lib/macro-constants';

export interface MacroLog {
  id: string;
  macroId: string;
  date: string; // YYYY-MM-DD
  outcome: MacroOutcome;
  note: string;
  tvLinks: string[];
  createdAt: string;
}

interface MacroStore {
  logs: MacroLog[];

  // Actions
  logMacro: (macroId: string, outcome: MacroOutcome, note?: string, tvLinks?: string[]) => void;
  updateLog: (logId: string, updates: Partial<Pick<MacroLog, 'outcome' | 'note' | 'tvLinks'>>) => void;
  deleteLog: (logId: string) => void;
  addTvLink: (macroId: string, link: string) => void;
  removeTvLink: (macroId: string, linkIndex: number) => void;

  // Queries
  getLogForMacroToday: (macroId: string) => MacroLog | undefined;
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

      logMacro: (macroId, outcome, note = '', tvLinks = []) => {
        const today = getTodayDate();
        const existing = get().logs.find(
          log => log.macroId === macroId && log.date === today
        );

        if (existing) {
          // Update existing log for today
          set({
            logs: get().logs.map(log =>
              log.id === existing.id
                ? { ...log, outcome, note, tvLinks }
                : log
            ),
          });
          toast.success('Macro log updated');
        } else {
          // Create new log
          const newLog: MacroLog = {
            id: `macro-${Date.now()}`,
            macroId,
            date: today,
            outcome,
            note,
            tvLinks,
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
          // Create a new log with NO_TRADE outcome if none exists
          const newLog: MacroLog = {
            id: `macro-${Date.now()}`,
            macroId,
            date: today,
            outcome: 'NO_TRADE',
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
