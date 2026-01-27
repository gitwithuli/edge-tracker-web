"use client";

import type { EconomicEvent } from "@/app/api/calendar/route";
import { CountdownTimer } from "./countdown-timer";

interface EventCardProps {
  event: EconomicEvent;
  compact?: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}",
  EU: "\u{1F1EA}\u{1F1FA}",
  GB: "\u{1F1EC}\u{1F1E7}",
  JP: "\u{1F1EF}\u{1F1F5}",
  CH: "\u{1F1E8}\u{1F1ED}",
  AU: "\u{1F1E6}\u{1F1FA}",
  CA: "\u{1F1E8}\u{1F1E6}",
  NZ: "\u{1F1F3}\u{1F1FF}",
  CN: "\u{1F1E8}\u{1F1F3}",
  ALL: "\u{1F310}",
};

function formatEventTime(isoTime: string): string {
  const date = new Date(isoTime);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isPast(isoTime: string): boolean {
  return new Date(isoTime) < new Date();
}

const IMPACT_STYLES = {
  high: {
    badge: "bg-[#C45A3B]/15 text-[#C45A3B]",
    dot: "bg-[#C45A3B]",
    card: "from-[#C45A3B]/[0.03] to-[#C45A3B]/[0.06] border-[#C45A3B]/15",
    corner: "bg-[#C45A3B]/[0.05]",
  },
  medium: {
    badge: "bg-[#D4A84B]/15 text-[#D4A84B]",
    dot: "bg-[#D4A84B]",
    card: "from-[#D4A84B]/[0.03] to-[#D4A84B]/[0.06] border-[#D4A84B]/15",
    corner: "bg-[#D4A84B]/[0.05]",
  },
  low: {
    badge: "bg-[#0F0F0F]/10 dark:bg-white/10 text-[#0F0F0F]/50 dark:text-white/50",
    dot: "bg-[#0F0F0F]/30 dark:bg-white/30",
    card: "from-[#0F0F0F]/[0.01] to-[#0F0F0F]/[0.02] border-[#0F0F0F]/5 dark:from-white/[0.01] dark:to-white/[0.02] dark:border-white/5",
    corner: "bg-[#0F0F0F]/[0.02] dark:bg-white/[0.02]",
  },
  holiday: {
    badge: "bg-[#8B9A7D]/15 text-[#8B9A7D]",
    dot: "bg-[#8B9A7D]",
    card: "from-[#8B9A7D]/[0.03] to-[#8B9A7D]/[0.06] border-[#8B9A7D]/15",
    corner: "bg-[#8B9A7D]/[0.05]",
  },
};

export function EventCard({ event, compact = false }: EventCardProps) {
  const flag = COUNTRY_FLAGS[event.country] || event.country;
  const eventPassed = isPast(event.time);
  const styles = IMPACT_STYLES[event.impact];

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          eventPassed
            ? "bg-[#0F0F0F]/[0.01] dark:bg-white/[0.01] border-[#0F0F0F]/5 dark:border-white/5 opacity-50"
            : `bg-gradient-to-r ${styles.card}`
        }`}
      >
        <span className="text-lg">{flag}</span>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#0F0F0F] dark:text-white truncate leading-tight">
            {event.event}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50">
              {formatEventTime(event.time)}
            </span>
            {event.estimate && (
              <span className="text-[10px] text-[#0F0F0F]/45 dark:text-white/45">
                F: {event.estimate}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${styles.dot} ${
              !eventPassed && event.impact !== "low" ? "animate-pulse" : ""
            }`}
          />
          <CountdownTimer targetTime={event.time} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-300 ${
        eventPassed
          ? "bg-[#0F0F0F]/[0.02] dark:bg-white/[0.02] border-[#0F0F0F]/5 dark:border-white/5 opacity-50"
          : `bg-gradient-to-br ${styles.card}`
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{flag}</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${styles.badge}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${styles.dot} ${
                !eventPassed && event.impact !== "low" ? "animate-pulse" : ""
              }`}
            />
            {event.impact}
          </span>
        </div>
        <span className="text-[11px] font-medium text-[#0F0F0F]/50 dark:text-white/50">
          {formatEventTime(event.time)}
        </span>
      </div>

      <h4
        className="text-sm text-[#0F0F0F] dark:text-white leading-snug mb-3"
        style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
      >
        {event.event}
      </h4>

      <div className="flex items-center justify-between pt-2 border-t border-[#0F0F0F]/5 dark:border-white/5">
        <div className="flex items-center gap-3 text-[10px]">
          {event.estimate && (
            <span className="text-[#0F0F0F]/50 dark:text-white/50">
              <span className="text-[#0F0F0F]/45 dark:text-white/45">F:</span> {event.estimate}
            </span>
          )}
          {event.prev && (
            <span className="text-[#0F0F0F]/50 dark:text-white/50">
              <span className="text-[#0F0F0F]/45 dark:text-white/45">P:</span> {event.prev}
            </span>
          )}
        </div>
        <CountdownTimer targetTime={event.time} />
      </div>
    </div>
  );
}
