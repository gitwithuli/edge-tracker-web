"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, TrendingUp, Bell, Zap, Palmtree } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { EconomicEvent } from "@/app/api/calendar/route";
import { EventCard } from "./event-card";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"] as const;
type Currency = (typeof CURRENCIES)[number];

const CURRENCY_FLAGS: Record<Currency, string> = {
  USD: "\u{1F1FA}\u{1F1F8}",
  EUR: "\u{1F1EA}\u{1F1FA}",
  GBP: "\u{1F1EC}\u{1F1E7}",
  JPY: "\u{1F1EF}\u{1F1F5}",
  CHF: "\u{1F1E8}\u{1F1ED}",
  AUD: "\u{1F1E6}\u{1F1FA}",
  CAD: "\u{1F1E8}\u{1F1E6}",
  NZD: "\u{1F1F3}\u{1F1FF}",
};

function EventSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0F0F0F]/[0.02] border border-[#0F0F0F]/5 animate-pulse">
      <div className="w-7 h-7 bg-[#0F0F0F]/10 rounded" />
      <div className="flex-1">
        <div className="h-4 w-3/4 bg-[#0F0F0F]/10 rounded mb-1" />
        <div className="h-3 w-1/3 bg-[#0F0F0F]/10 rounded" />
      </div>
      <div className="h-6 w-14 bg-[#0F0F0F]/10 rounded-full" />
    </div>
  );
}

function formatHolidayDate(isoTime: string): string {
  const date = new Date(isoTime);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function EconomicCalendarSidebar() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [holidays, setHolidays] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [highImpactOnly, setHighImpactOnly] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/calendar");
      if (!res.ok) {
        throw new Error("Failed to fetch calendar");
      }
      const data = await res.json();
      setEvents(data.events || []);
      setHolidays(data.holidays || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && events.length === 0 && !loading) {
      fetchEvents();
    }
  }, [open, events.length, loading, fetchEvents]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        if (e.impact === "holiday") return false;
        const currencyMatch = !selectedCurrency || e.currency === selectedCurrency;
        const impactMatch = !highImpactOnly || e.impact === "high" || e.impact === "medium";
        return currencyMatch && impactMatch;
      })
      .sort((a, b) => {
        const aTime = new Date(a.time);
        const bTime = new Date(b.time);
        const aIsPast = aTime < now;
        const bIsPast = bTime < now;

        // Upcoming first, then past
        if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;

        // Within same group, sort by time (earliest first for upcoming, latest first for past)
        return aIsPast
          ? bTime.getTime() - aTime.getTime()
          : aTime.getTime() - bTime.getTime();
      });
  }, [events, selectedCurrency, highImpactOnly]);

  const highImpactCount = events.filter((e) => e.impact === "high").length;
  const upcomingCount = filteredEvents.filter(
    (e) => new Date(e.time) > new Date()
  ).length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative p-2 rounded-full text-[#0F0F0F]/40 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300"
          title="Economic Calendar"
          aria-label="Economic Calendar"
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          {highImpactCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#C45A3B] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {highImpactCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#FAF7F2] border-[#0F0F0F]/5 p-0 flex flex-col"
      >
        <SheetHeader className="p-5 pb-4 border-b border-[#0F0F0F]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C45A3B]/10 to-[#D4A84B]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#C45A3B]" />
              </div>
              <div>
                <SheetTitle
                  className="text-base tracking-tight text-[#0F0F0F] text-left"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Economic Calendar
                </SheetTitle>
                <p className="text-[10px] text-[#0F0F0F]/40 mt-0.5">{today}</p>
              </div>
            </div>
          </div>

          {/* Impact Toggle */}
          <div className="mt-4">
            <button
              onClick={() => setHighImpactOnly(!highImpactOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full ${
                highImpactOnly
                  ? "bg-[#C45A3B] text-white"
                  : "bg-[#0F0F0F]/5 text-[#0F0F0F]/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>High & Medium Impact Only</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                highImpactOnly ? "bg-white/20" : "bg-[#0F0F0F]/10"
              }`}>
                {highImpactOnly ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Currency Filter */}
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/40 mb-2">
              Filter by Currency
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCurrency(null)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  !selectedCurrency
                    ? "bg-[#0F0F0F] text-[#FAF7F2]"
                    : "bg-[#0F0F0F]/5 text-[#0F0F0F]/50 hover:bg-[#0F0F0F]/10"
                }`}
              >
                All
              </button>
              {CURRENCIES.map((currency) => (
                <button
                  key={currency}
                  onClick={() => setSelectedCurrency(selectedCurrency === currency ? null : currency)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    selectedCurrency === currency
                      ? "bg-[#0F0F0F] text-[#FAF7F2]"
                      : "bg-[#0F0F0F]/5 text-[#0F0F0F]/50 hover:bg-[#0F0F0F]/10"
                  }`}
                >
                  <span className="text-sm">{CURRENCY_FLAGS[currency]}</span>
                  {currency}
                </button>
              ))}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-5 space-y-2">
              <EventSkeleton />
              <EventSkeleton />
              <EventSkeleton />
              <EventSkeleton />
            </div>
          )}

          {error && (
            <div className="text-center py-12 px-5">
              <div className="w-12 h-12 rounded-full bg-[#C45A3B]/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-[#C45A3B]" />
              </div>
              <p className="text-sm text-[#C45A3B] mb-2">Unable to load events</p>
              <p className="text-xs text-[#0F0F0F]/40 mb-4">{error}</p>
              <button
                onClick={fetchEvents}
                className="text-sm text-[#0F0F0F] hover:text-[#C45A3B] font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Events Section */}
              <div className="p-4">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-6 h-6 text-[#0F0F0F]/20 mx-auto mb-2" />
                    <p className="text-xs text-[#0F0F0F]/40">
                      {selectedCurrency
                        ? `No ${selectedCurrency} events today`
                        : highImpactOnly
                          ? "No high-impact events today"
                          : "No events scheduled for today"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/40">
                        {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                        {selectedCurrency && ` for ${selectedCurrency}`}
                      </span>
                      <span className="text-[10px] text-[#0F0F0F]/30">
                        {upcomingCount} upcoming
                      </span>
                    </div>
                    <div className="space-y-2">
                      {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} compact />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Holidays Section */}
              {holidays.length > 0 && (
                <div className="p-4 pt-0">
                  <div className="border-t border-[#0F0F0F]/5 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Palmtree className="w-4 h-4 text-[#8B9A7D]" />
                      <span className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/40">
                        Market Holidays
                      </span>
                    </div>
                    <div className="space-y-2">
                      {holidays.map((holiday) => {
                        const isPast = new Date(holiday.time) < new Date();
                        return (
                          <div
                            key={holiday.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              isPast
                                ? "bg-[#0F0F0F]/[0.02] border-[#0F0F0F]/5 opacity-60"
                                : "bg-[#8B9A7D]/5 border-[#8B9A7D]/10"
                            }`}
                          >
                            <span className="text-lg">
                              {CURRENCY_FLAGS[holiday.currency as Currency]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-[#0F0F0F] truncate">
                                {holiday.event}
                              </p>
                              <p className={`text-[10px] ${isPast ? "text-[#0F0F0F]/40" : "text-[#8B9A7D]"}`}>
                                {formatHolidayDate(holiday.time)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 border-t border-[#0F0F0F]/5 bg-[#0F0F0F]/[0.02]">
          <p className="text-[9px] text-center text-[#0F0F0F]/30">
            Data from Forex Factory • Times in your local timezone
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
