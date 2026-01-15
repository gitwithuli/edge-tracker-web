import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TRADINGVIEW_SNAPSHOT_BASE_URL } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date to YYYY-MM-DD string (ISO date only)
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/**
 * Parse a YYYY-MM-DD string to a Date object at noon (avoids timezone issues)
 */
export function parseDateKey(dateKey: string): Date {
  return new Date(dateKey + "T12:00:00");
}

/**
 * Format a date for display (e.g., "Jan 15, 2026")
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === "string" ? parseDateKey(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date with weekday for display (e.g., "Wed, Jan 15, 2026")
 */
export function formatDateWithWeekday(date: Date | string): string {
  const d = typeof date === "string" ? parseDateKey(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format currency with compact notation for large numbers
 * e.g., 1234 -> "$1,234", 12345 -> "$12.3k", 123456 -> "$123k"
 */
export function formatCurrency(value: number, forceCompact = false): string {
  const absValue = Math.abs(value);
  const sign = value >= 0 ? '+' : '-';

  if (absValue >= 10000 || forceCompact) {
    // Use compact notation for large numbers
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 10000) {
      return `${sign}$${Math.round(absValue / 1000)}k`;
    }
    if (absValue >= 1000) {
      return `${sign}$${(absValue / 1000).toFixed(1)}k`;
    }
  }

  // Standard formatting for smaller numbers
  return `${sign}$${absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format currency for display in cards (no decimal places for whole numbers)
 */
export function formatCurrencyCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value >= 0 ? '+' : '-';

  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(absValue >= 10000 ? 0 : 1)}k`;
  }
  return `${sign}$${Math.round(absValue)}`;
}

export function getTVImageUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/x\/([a-zA-Z0-9]+)\//);
  if (match && match[1]) {
    const id = match[1];
    const firstChar = id.charAt(0).toLowerCase();
    return `${TRADINGVIEW_SNAPSHOT_BASE_URL}/${firstChar}/${id}.png`;
  }
  return null;
}
