"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, TrendingUp, Bell, Zap, Palmtree, ChevronDown, ChevronUp } from "lucide-react";
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

const CURRENCY_FLAGS: Record<Currency | "All", string> = {
  USD: "\u{1F1FA}\u{1F1F8}",
  EUR: "\u{1F1EA}\u{1F1FA}",
  GBP: "\u{1F1EC}\u{1F1E7}",
  JPY: "\u{1F1EF}\u{1F1F5}",
  CHF: "\u{1F1E8}\u{1F1ED}",
  AUD: "\u{1F1E6}\u{1F1FA}",
  CAD: "\u{1F1E8}\u{1F1E6}",
  NZD: "\u{1F1F3}\u{1F1FF}",
  All: "\u{1F310}",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DayGroup {
  date: Date;
  dayName: string;
  fullDayName: string;
  dateStr: string;
  events: EconomicEvent[];
  holidays: EconomicEvent[];
  isPast: boolean;
  isToday: boolean;
}

function isWeekendDay(): boolean {
  const now = new Date();
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etString);
  const day = etDate.getDay();
  return day === 0 || day === 6;
}

function getETDate(date: Date): Date {
  const etString = date.toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(etString);
}

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

function DaySection({
  dayGroup,
  selectedCurrency,
  highImpactOnly,
}: {
  dayGroup: DayGroup;
  selectedCurrency: Currency | null;
  highImpactOnly: boolean;
}) {
  const [expanded, setExpanded] = useState(!dayGroup.isPast);

  const filteredEvents = useMemo(() => {
    return dayGroup.events
      .filter((e) => {
        // "All" events affect all markets, always show them
        const currencyMatch = !selectedCurrency || e.currency === selectedCurrency || e.currency === "All";
        const impactMatch = !highImpactOnly || e.impact === "high" || e.impact === "medium";
        return currencyMatch && impactMatch;
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [dayGroup.events, selectedCurrency, highImpactOnly]);

  const hasHoliday = dayGroup.holidays.length > 0;

  if (dayGroup.isPast) return null;

  return (
    <div className={`border-b border-[#0F0F0F]/5 dark:border-white/5 last:border-b-0 ${dayGroup.isPast ? "opacity-40" : ""}`}>
      {/* Day Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={dayGroup.isPast}
        className={`w-full p-4 flex items-center justify-between transition-colors ${
          dayGroup.isPast ? "cursor-not-allowed" : "hover:bg-[#0F0F0F]/[0.02] dark:hover:bg-white/[0.02]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${
              dayGroup.isToday
                ? "bg-[#C45A3B] text-white"
                : hasHoliday
                  ? "bg-[#8B9A7D]/20 text-[#8B9A7D]"
                  : "bg-[#0F0F0F]/5 dark:bg-white/10 text-[#0F0F0F]/60 dark:text-white/60"
            }`}
          >
            <span className="text-[10px] font-medium uppercase">{dayGroup.dayName}</span>
            <span className="text-sm font-bold leading-none">{dayGroup.date.getDate()}</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${dayGroup.isToday ? "text-[#C45A3B]" : "text-[#0F0F0F] dark:text-white"}`}
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {dayGroup.fullDayName}
              </span>
              {dayGroup.isToday && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C45A3B]/10 text-[#C45A3B] font-medium uppercase">
                  Today
                </span>
              )}
              {hasHoliday && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#8B9A7D]/10 text-[#8B9A7D] font-medium">
                  Holiday
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {!dayGroup.isPast && (
          expanded ? (
            <ChevronUp className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
          )
        )}
      </button>

      {/* Expanded Content */}
      {expanded && !dayGroup.isPast && (
        <div className="px-4 pb-4">
          {/* Holiday Banner */}
          {dayGroup.holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-[#8B9A7D]/10 border border-[#8B9A7D]/20"
            >
              <Palmtree className="w-4 h-4 text-[#8B9A7D]" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#0F0F0F] dark:text-white">{holiday.event}</p>
                <p className="text-[10px] text-[#8B9A7D]">
                  {CURRENCY_FLAGS[holiday.currency as Currency]} {holiday.currency} Market Closed
                </p>
              </div>
            </div>
          ))}

          {/* Events List */}
          {filteredEvents.length > 0 && (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EconomicCalendarSidebar() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [holidays, setHolidays] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [highImpactOnly, setHighImpactOnly] = useState(true);
  const [isWeekendData, setIsWeekendData] = useState(false);
  const isWeekend = isWeekendDay();

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
      setIsWeekendData(data.isWeekend || false);

      if (data.isWeekend) {
        setSelectedCurrency("USD");
      }
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

  // Group events by day (Mon-Fri only, exclude weekends)
  const dayGroups = useMemo((): DayGroup[] => {
    const now = getETDate(new Date());
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const groups: Map<string, DayGroup> = new Map();

    // Process all events (events array already contains holidays)
    events.forEach((event) => {
      const eventDate = new Date(event.time);
      const etEventDate = getETDate(eventDate);
      const dayOfWeek = etEventDate.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) return;

      const dateKey = etEventDate.toDateString();

      if (!groups.has(dateKey)) {
        const eventDayStart = new Date(etEventDate);
        eventDayStart.setHours(0, 0, 0, 0);

        groups.set(dateKey, {
          date: etEventDate,
          dayName: DAY_NAMES[dayOfWeek],
          fullDayName: FULL_DAY_NAMES[dayOfWeek],
          dateStr: dateKey,
          events: [],
          holidays: [],
          isPast: eventDayStart < today,
          isToday: eventDayStart.getTime() === today.getTime(),
        });
      }

      const group = groups.get(dateKey)!;
      if (event.impact === "holiday") {
        group.holidays.push(event);
      } else {
        group.events.push(event);
      }
    });

    // Sort by date (Monday first)
    return Array.from(groups.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter((g) => !g.isPast); // Remove past days
  }, [events]);

  // Get today's events for notification badge
  const todayNotification = useMemo(() => {
    const todayGroup = dayGroups.find((g) => g.isToday);
    if (!todayGroup) return null;

    const todayEvents = todayGroup.events.filter((e) => e.impact !== "holiday");
    const highCount = todayEvents.filter((e) => e.impact === "high").length;
    const mediumCount = todayEvents.filter((e) => e.impact === "medium").length;

    if (highCount > 0) return { count: highCount, color: "bg-[#C45A3B]" };
    if (mediumCount > 0) return { count: mediumCount, color: "bg-[#D4A84B]" };
    return null;
  }, [dayGroups]);

  const weekRange = useMemo(() => {
    if (dayGroups.length === 0) return "";
    const first = dayGroups[0];
    const last = dayGroups[dayGroups.length - 1];
    const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${formatDate(first.date)} - ${formatDate(last.date)}`;
  }, [dayGroups]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative p-2 rounded-full text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 transition-all duration-300"
          title="Economic Calendar"
          aria-label="Economic Calendar"
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          {todayNotification && (
            <span className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 ${todayNotification.color} text-white text-[8px] font-bold rounded-full flex items-center justify-center`}>
              {todayNotification.count}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#FAF7F2] dark:bg-[#0F0F0F] border-[#0F0F0F]/5 dark:border-white/10 p-0 flex flex-col"
      >
        <SheetHeader className="p-5 pb-4 border-b border-[#0F0F0F]/5 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C45A3B]/10 to-[#D4A84B]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#C45A3B]" />
              </div>
              <div>
                <SheetTitle
                  className="text-base tracking-tight text-[#0F0F0F] dark:text-white text-left"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {isWeekendData ? "Upcoming Week" : "This Week"}
                </SheetTitle>
                <p className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 mt-0.5">
                  {weekRange || "Loading..."}
                </p>
              </div>
            </div>
          </div>

          {/* Currency Filter Row - Above action buttons */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {CURRENCIES.map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(selectedCurrency === currency ? null : currency)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                  selectedCurrency === currency
                    ? "bg-[#0F0F0F] dark:bg-white ring-2 ring-[#0F0F0F]/20 dark:ring-white/20"
                    : "bg-[#0F0F0F]/5 dark:bg-white/10 hover:bg-[#0F0F0F]/10 dark:hover:bg-white/20"
                }`}
              >
                <span>{CURRENCY_FLAGS[currency]}</span>
              </button>
            ))}
          </div>

          {/* Global Filters */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setHighImpactOnly(!highImpactOnly)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                highImpactOnly
                  ? "bg-[#C45A3B] text-white"
                  : "bg-[#0F0F0F]/5 dark:bg-white/10 text-[#0F0F0F]/60 dark:text-white/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>High Impact</span>
            </button>
            <button
              onClick={() => setSelectedCurrency(selectedCurrency === "USD" ? null : "USD")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedCurrency === "USD"
                  ? "bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F]"
                  : "bg-[#0F0F0F]/5 dark:bg-white/10 text-[#0F0F0F]/60 dark:text-white/60"
              }`}
            >
              <span>{CURRENCY_FLAGS.USD}</span>
              <span>USD Only</span>
            </button>
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
              <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40 mb-4">{error}</p>
              <button
                onClick={fetchEvents}
                className="text-sm text-[#0F0F0F] dark:text-white hover:text-[#C45A3B] font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {dayGroups.length === 0 ? (
                <div className="text-center py-12 px-5">
                  <Calendar className="w-8 h-8 text-[#0F0F0F]/20 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-[#0F0F0F]/40 dark:text-white/40">No upcoming events this week</p>
                </div>
              ) : (
                <div>
                  {dayGroups.map((dayGroup) => (
                    <DaySection
                      key={dayGroup.dateStr}
                      dayGroup={dayGroup}
                      selectedCurrency={selectedCurrency}
                      highImpactOnly={highImpactOnly}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 border-t border-[#0F0F0F]/5 dark:border-white/10 bg-[#0F0F0F]/[0.02] dark:bg-white/[0.02]">
          <p className="text-[9px] text-center text-[#0F0F0F]/30 dark:text-white/30">
            Data from Forex Factory • Times in your local timezone
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
