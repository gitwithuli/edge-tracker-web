// Macro Time Windows for ICT/SMC Trading
// All times are in ET (Eastern Time)

export interface MacroWindow {
  id: string;
  name: string;
  shortName: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  category: 'hourly' | 'rth_close';
  description?: string;
}

// Hourly macros: Last 10 mins of hour + first 10 mins of next hour
// These repeat throughout the trading day
export const HOURLY_MACRO_TIMES = [
  { hour: 9, minute: 50 },   // 09:50 - 10:10
  { hour: 10, minute: 50 },  // 10:50 - 11:10
  { hour: 11, minute: 50 },  // 11:50 - 12:10
  { hour: 12, minute: 50 },  // 12:50 - 13:10
  { hour: 13, minute: 50 },  // 13:50 - 14:10
] as const;

// Generate hourly macro windows
export const HOURLY_MACROS: MacroWindow[] = HOURLY_MACRO_TIMES.map(({ hour, minute }) => ({
  id: `hourly-${hour}${minute}`,
  name: `${hour}:${minute} - ${hour + 1}:10 Macro`,
  shortName: `${hour}:${minute}`,
  startHour: hour,
  startMinute: minute,
  endHour: hour + 1,
  endMinute: 10,
  category: 'hourly' as const,
  description: 'Hourly macro - last 10 + first 10 minutes',
}));

// RTH Closing Hour Macros (14:50 - 16:10)
export const RTH_CLOSE_MACROS: MacroWindow[] = [
  {
    id: 'rth-macro-1',
    name: 'PM Silver Bullet',
    shortName: 'PM SB',
    startHour: 14,
    startMinute: 50,
    endHour: 15,
    endMinute: 10,
    category: 'rth_close',
    description: 'First RTH closing macro window',
  },
  {
    id: 'rth-macro-2',
    name: 'Power Hour',
    shortName: 'PWR HR',
    startHour: 15,
    startMinute: 15,
    endHour: 15,
    endMinute: 45,
    category: 'rth_close',
    description: 'Middle RTH closing macro window',
  },
  {
    id: 'rth-macro-3',
    name: 'Market Close',
    shortName: 'CLOSE',
    startHour: 15,
    startMinute: 50,
    endHour: 16,
    endMinute: 10,
    category: 'rth_close',
    description: 'Final RTH closing macro window',
  },
];

// All macros combined and sorted by start time
export const ALL_MACROS: MacroWindow[] = [...HOURLY_MACROS, ...RTH_CLOSE_MACROS].sort((a, b) => {
  const aMinutes = a.startHour * 60 + a.startMinute;
  const bMinutes = b.startHour * 60 + b.startMinute;
  return aMinutes - bMinutes;
});

// Macro log outcome types
export const MACRO_OUTCOMES = ['WIN', 'LOSS', 'BREAKEVEN', 'NO_TRADE'] as const;
export type MacroOutcome = typeof MACRO_OUTCOMES[number];

// Helper to check if a time is within a macro window
export function isWithinMacro(
  macro: MacroWindow,
  hour: number,
  minute: number
): boolean {
  const currentMinutes = hour * 60 + minute;
  const startMinutes = macro.startHour * 60 + macro.startMinute;
  const endMinutes = macro.endHour * 60 + macro.endMinute;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// Helper to get minutes until macro starts (negative if already started/passed)
export function getMinutesUntilMacro(
  macro: MacroWindow,
  hour: number,
  minute: number
): number {
  const currentMinutes = hour * 60 + minute;
  const startMinutes = macro.startHour * 60 + macro.startMinute;
  return startMinutes - currentMinutes;
}

// Helper to get minutes remaining in macro (0 if not active)
export function getMinutesRemainingInMacro(
  macro: MacroWindow,
  hour: number,
  minute: number
): number {
  const currentMinutes = hour * 60 + minute;
  const endMinutes = macro.endHour * 60 + macro.endMinute;

  if (!isWithinMacro(macro, hour, minute)) return 0;
  return endMinutes - currentMinutes;
}

// Format time for display (24h to 12h with AM/PM)
export function formatMacroTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}
