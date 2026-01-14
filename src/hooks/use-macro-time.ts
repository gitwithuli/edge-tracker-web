"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ALL_MACROS,
  MacroWindow,
  isWithinMacro,
  getMinutesUntilMacro,
  getMinutesRemainingInMacro,
} from "@/lib/macro-constants";

export interface MacroStatus {
  macro: MacroWindow;
  status: 'upcoming' | 'active' | 'passed';
  minutesUntil: number;
  minutesRemaining: number;
}

export interface UseMacroTimeReturn {
  currentTime: Date;
  etHour: number;
  etMinute: number;
  etSecond: number;
  activeMacro: MacroWindow | null;
  nextMacro: MacroWindow | null;
  minutesToNextMacro: number;
  secondsToNextMacro: number;
  macroStatuses: MacroStatus[];
  isTradingHours: boolean;
}

// Convert local time to ET
function getETTime(date: Date): { hour: number; minute: number; second: number } {
  const etString = date.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etString);
  return {
    hour: etDate.getHours(),
    minute: etDate.getMinutes(),
    second: etDate.getSeconds(),
  };
}

export function useMacroTime(): UseMacroTimeReturn {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { hour: etHour, minute: etMinute, second: etSecond } = useMemo(() => {
    return getETTime(currentTime);
  }, [currentTime]);

  // Find active macro
  const activeMacro = useMemo(() => {
    return ALL_MACROS.find(macro => isWithinMacro(macro, etHour, etMinute)) || null;
  }, [etHour, etMinute]);

  // Calculate all macro statuses
  const macroStatuses = useMemo((): MacroStatus[] => {
    const currentMinutes = etHour * 60 + etMinute;

    return ALL_MACROS.map(macro => {
      const startMinutes = macro.startHour * 60 + macro.startMinute;
      const endMinutes = macro.endHour * 60 + macro.endMinute;

      let status: MacroStatus['status'];
      if (currentMinutes >= endMinutes) {
        status = 'passed';
      } else if (currentMinutes >= startMinutes) {
        status = 'active';
      } else {
        status = 'upcoming';
      }

      return {
        macro,
        status,
        minutesUntil: getMinutesUntilMacro(macro, etHour, etMinute),
        minutesRemaining: getMinutesRemainingInMacro(macro, etHour, etMinute),
      };
    });
  }, [etHour, etMinute]);

  // Find next macro
  const nextMacro = useMemo(() => {
    const upcoming = macroStatuses.find(s => s.status === 'upcoming');
    return upcoming?.macro || null;
  }, [macroStatuses]);

  // Calculate time to next macro
  const { minutesToNextMacro, secondsToNextMacro } = useMemo(() => {
    if (!nextMacro) return { minutesToNextMacro: 0, secondsToNextMacro: 0 };

    const nextStatus = macroStatuses.find(s => s.macro.id === nextMacro.id);
    if (!nextStatus) return { minutesToNextMacro: 0, secondsToNextMacro: 0 };

    // More precise calculation including seconds
    const currentTotalSeconds = etHour * 3600 + etMinute * 60 + etSecond;
    const nextStartSeconds = nextMacro.startHour * 3600 + nextMacro.startMinute * 60;
    const diffSeconds = nextStartSeconds - currentTotalSeconds;

    return {
      minutesToNextMacro: Math.floor(diffSeconds / 60),
      secondsToNextMacro: diffSeconds % 60,
    };
  }, [nextMacro, macroStatuses, etHour, etMinute, etSecond]);

  // Check if within trading hours (9:30 AM - 4:00 PM ET)
  const isTradingHours = useMemo(() => {
    const currentMinutes = etHour * 60 + etMinute;
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    return currentMinutes >= marketOpen && currentMinutes < marketClose;
  }, [etHour, etMinute]);

  return {
    currentTime,
    etHour,
    etMinute,
    etSecond,
    activeMacro,
    nextMacro,
    minutesToNextMacro,
    secondsToNextMacro,
    macroStatuses,
    isTradingHours,
  };
}
