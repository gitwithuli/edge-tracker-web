import { NextResponse } from "next/server";

export interface EconomicEvent {
  id: string;
  country: string;
  currency: string;
  event: string;
  impact: "high" | "medium" | "low" | "holiday";
  time: string;
  actual?: string;
  estimate?: string;
  prev?: string;
}

interface FFEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
}

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  CHF: "CH",
  AUD: "AU",
  CAD: "CA",
  NZD: "NZ",
  CNY: "CN",
  All: "ALL",
};

const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];

function normalizeImpact(impact: string): "high" | "medium" | "low" | "holiday" {
  const lower = impact.toLowerCase();
  if (lower === "high") return "high";
  if (lower === "medium") return "medium";
  if (lower === "holiday") return "holiday";
  return "low";
}

export async function GET(request: Request) {
  try {
    // Check if it's weekend (ET timezone)
    const now = new Date();
    const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const etDate = new Date(etString);
    const dayOfWeek = etDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Always use "thisweek" - ForexFactory's week runs Sat-Fri, so on weekends
    // "thisweek" already contains the upcoming Mon-Fri trading days
    const response = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const data: FFEvent[] = await response.json();

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    // Get events for this week (7 days back and forward)
    const weekEvents: EconomicEvent[] = data
      .filter((e) => {
        const isMajor = MAJOR_CURRENCIES.includes(e.country) || e.country === "All";
        const eventTime = new Date(e.date);
        const isInWeek = eventTime >= weekStart && eventTime <= weekEnd;
        return isMajor && isInWeek;
      })
      .map((e, index) => ({
        id: `${e.date}-${e.country}-${index}`,
        country: CURRENCY_TO_COUNTRY[e.country] || e.country,
        currency: e.country,
        event: e.title,
        impact: normalizeImpact(e.impact),
        time: new Date(e.date).toISOString(),
        estimate: e.forecast || undefined,
        prev: e.previous || undefined,
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Get holidays for selected week
    const holidays: EconomicEvent[] = data
      .filter((e) => {
        const isMajor = MAJOR_CURRENCIES.includes(e.country);
        const isHoliday = e.impact.toLowerCase() === "holiday";
        const eventTime = new Date(e.date);
        const isInWeek = eventTime >= weekStart && eventTime <= weekEnd;
        return isMajor && isHoliday && isInWeek;
      })
      .map((e, index) => ({
        id: `holiday-${e.date}-${e.country}-${index}`,
        country: CURRENCY_TO_COUNTRY[e.country] || e.country,
        currency: e.country,
        event: e.title,
        impact: "holiday" as const,
        time: new Date(e.date).toISOString(),
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({
      events: weekEvents,
      holidays,
      isWeekend,
    });
  } catch (error) {
    console.error("Economic calendar fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch economic calendar" },
      { status: 500 }
    );
  }
}
