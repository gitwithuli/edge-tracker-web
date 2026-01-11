import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TRADINGVIEW_SNAPSHOT_BASE_URL } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
