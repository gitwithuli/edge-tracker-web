// Macro Time Windows for ICT/SMC Trading
// All times are in ET (Eastern Time)

export type MacroCategory = 'overnight' | 'london' | 'rth' | 'rth_close' | 'asia';

export interface MacroWindow {
  id: string;
  name: string;
  shortName: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  category: MacroCategory;
  isAsia?: boolean;
  description?: string;
}

// Helper to generate hourly macro window
function createHourlyMacro(hour: number, category: MacroCategory, isAsia = false): MacroWindow {
  const nextHour = (hour + 1) % 24;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return {
    id: `hourly-${hour.toString().padStart(2, '0')}50`,
    name: `${displayHour}:50 ${period} Macro`,
    shortName: `${displayHour}:50${period.charAt(0)}`,
    startHour: hour,
    startMinute: 50,
    endHour: nextHour,
    endMinute: 10,
    category,
    isAsia,
    description: `${category.charAt(0).toUpperCase() + category.slice(1)} session macro`,
  };
}

// Overnight macros (12 AM - 4 AM ET) - After midnight futures trading
export const OVERNIGHT_MACROS: MacroWindow[] = [
  createHourlyMacro(0, 'overnight'),   // 00:50 - 01:10
  createHourlyMacro(1, 'overnight'),   // 01:50 - 02:10
  createHourlyMacro(2, 'overnight'),   // 02:50 - 03:10
  createHourlyMacro(3, 'overnight'),   // 03:50 - 04:10
];

// London session macros (4 AM - 9 AM ET)
export const LONDON_MACROS: MacroWindow[] = [
  createHourlyMacro(4, 'london'),    // 04:50 - 05:10
  createHourlyMacro(5, 'london'),    // 05:50 - 06:10
  createHourlyMacro(6, 'london'),    // 06:50 - 07:10
  createHourlyMacro(7, 'london'),    // 07:50 - 08:10
  createHourlyMacro(8, 'london'),    // 08:50 - 09:10
];

// RTH session macros (9 AM - 2 PM ET)
export const RTH_MACROS: MacroWindow[] = [
  createHourlyMacro(9, 'rth'),     // 09:50 - 10:10 (AM Silver Bullet)
  createHourlyMacro(10, 'rth'),    // 10:50 - 11:10
  createHourlyMacro(11, 'rth'),    // 11:50 - 12:10
  createHourlyMacro(12, 'rth'),    // 12:50 - 13:10
  createHourlyMacro(13, 'rth'),    // 13:50 - 14:10
];

// RTH Closing Hour Macros (14:50 - 16:10)
export const RTH_CLOSE_MACROS: MacroWindow[] = [
  {
    id: 'rth-close-1',
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
    id: 'rth-close-2',
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
    id: 'rth-close-3',
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

// Asia session macros (6 PM - 12 AM ET) - Optional, disabled by default
export const ASIA_MACROS: MacroWindow[] = [
  createHourlyMacro(18, 'asia', true),  // 18:50 - 19:10
  createHourlyMacro(19, 'asia', true),  // 19:50 - 20:10
  createHourlyMacro(20, 'asia', true),  // 20:50 - 21:10
  createHourlyMacro(21, 'asia', true),  // 21:50 - 22:10
  createHourlyMacro(22, 'asia', true),  // 22:50 - 23:10
  createHourlyMacro(23, 'asia', true),  // 23:50 - 00:10
];

// Standard macros (non-Asia) - shown on dashboard by default
export const STANDARD_MACROS: MacroWindow[] = [
  ...OVERNIGHT_MACROS,
  ...LONDON_MACROS,
  ...RTH_MACROS,
  ...RTH_CLOSE_MACROS,
].sort((a, b) => {
  const aMinutes = a.startHour * 60 + a.startMinute;
  const bMinutes = b.startHour * 60 + b.startMinute;
  return aMinutes - bMinutes;
});

// All macros including Asia (for calendar/stats when enabled)
export const ALL_MACROS: MacroWindow[] = [
  ...STANDARD_MACROS,
  ...ASIA_MACROS,
].sort((a, b) => {
  const aMinutes = a.startHour * 60 + a.startMinute;
  const bMinutes = b.startHour * 60 + b.startMinute;
  return aMinutes - bMinutes;
});

// Filter macros by Asia setting
export function getMacrosForDisplay(includeAsia: boolean): MacroWindow[] {
  return includeAsia ? ALL_MACROS : STANDARD_MACROS;
}

// Macro log data types (tape-reading analysis, not trade outcomes)
export const MACRO_DIRECTIONS = ['BULLISH', 'BEARISH', 'CONSOLIDATION'] as const;
export type MacroDirection = typeof MACRO_DIRECTIONS[number];

export const DISPLACEMENT_QUALITIES = ['CLEAN', 'CHOPPY'] as const;
export type DisplacementQuality = typeof DISPLACEMENT_QUALITIES[number];

export const LIQUIDITY_SWEEPS = ['HIGHS', 'LOWS', 'BOTH', 'NONE'] as const;
export type LiquiditySweep = typeof LIQUIDITY_SWEEPS[number];

export interface MacroLogData {
  pointsMoved: number | null;
  direction: MacroDirection | null;
  displacementQuality: DisplacementQuality | null;
  liquiditySweep: LiquiditySweep | null;
}

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
