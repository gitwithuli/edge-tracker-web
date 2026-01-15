"use client";

import { useMemo } from "react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";

interface StatsCardsProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
}

export function StatsCards({ logs, edgesWithLogs }: StatsCardsProps) {
  const stats = useMemo(() => {
    // Use logs directly - filtering is now done by parent component
    const totalDaysLogged = logs.length;
    const occurredLogs = logs.filter(l => l.result === "OCCURRED");
    const occurrences = occurredLogs.length;
    const occurrenceRate = totalDaysLogged > 0 ? Math.round((occurrences / totalDaysLogged) * 100) : 0;

    // Win rate calculation
    const wins = occurredLogs.filter(l => l.outcome === "WIN").length;
    const losses = occurredLogs.filter(l => l.outcome === "LOSS").length;
    const winRate = occurrences > 0 ? Math.round((wins / occurrences) * 100) : 0;

    // Find date range of current logs for comparison calculation
    const sortedDates = logs
      .map(l => l.date)
      .filter(Boolean)
      .sort();

    const minDate = sortedDates.length > 0 ? sortedDates[0] : undefined;
    const maxDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : undefined;

    // Calculate range duration in days
    const rangeDays = minDate && maxDate
      ? Math.ceil((new Date(maxDate).getTime() - new Date(minDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 7;

    // Best day calculation from filtered logs
    const dayOccurrences: Record<string, number> = {};
    occurredLogs.forEach(log => {
      dayOccurrences[log.dayOfWeek] = (dayOccurrences[log.dayOfWeek] || 0) + 1;
    });
    const bestDay = Object.keys(dayOccurrences).length > 0
      ? Object.keys(dayOccurrences).reduce((a, b) => dayOccurrences[a] > dayOccurrences[b] ? a : b)
      : null;

    // Calculate average per week from filtered data
    const allWeekNumbers = new Set<string>();
    logs.forEach(log => {
      if (log.date) {
        const d = new Date(log.date + 'T12:00:00');
        const weekNum = `${d.getFullYear()}-${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
        allWeekNumbers.add(weekNum);
      }
    });
    const totalWeeks = allWeekNumbers.size || 1;
    const avgPerWeek = (occurrences / totalWeeks).toFixed(1);

    // Hot edge from filtered data
    const edgeStats = edgesWithLogs.map(edge => {
      const edgeLogs = edge.logs;
      const edgeOccurrences = edgeLogs.filter(l => l.result === "OCCURRED").length;
      const edgeTotal = edgeLogs.length;
      return {
        name: edge.name,
        occurrenceRate: edgeTotal >= 3 ? Math.round((edgeOccurrences / edgeTotal) * 100) : 0,
        total: edgeTotal,
      };
    }).filter(e => e.total >= 3);

    const hotEdge = edgeStats.length > 0
      ? edgeStats.reduce((a, b) => a.occurrenceRate > b.occurrenceRate ? a : b)
      : null;

    return {
      totalDaysLogged,
      occurrences,
      occurrenceRate,
      bestDay,
      avgPerWeek,
      hotEdge,
      rangeDays,
      winRate,
      wins,
      losses,
    };
  }, [logs, edgesWithLogs]);

  const statItems = [
    {
      value: stats.totalDaysLogged.toString(),
      label: "Days Logged",
      sublabel: `${stats.occurrences} with setups`,
      accent: false,
    },
    {
      value: `${stats.occurrenceRate}%`,
      label: "Occurrence Rate",
      sublabel: stats.totalDaysLogged > 0 ? `${stats.rangeDays} day period` : null,
      accent: stats.occurrenceRate >= 50,
    },
    {
      value: `${stats.winRate}%`,
      label: "Win Rate",
      sublabel: stats.occurrences > 0 ? `${stats.wins}W / ${stats.losses}L` : null,
      accent: stats.winRate >= 50,
    },
    {
      value: stats.avgPerWeek,
      label: "Weekly Average",
      sublabel: stats.bestDay ? `Best: ${stats.bestDay.slice(0, 3)}` : null,
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statItems.map((item, i) => (
        <div
          key={i}
          className="p-5 sm:p-6 rounded-2xl bg-white border border-[#0F0F0F]/5 hover:border-[#0F0F0F]/10 transition-colors duration-300"
        >
          <p
            className="text-3xl sm:text-4xl tracking-tight text-[#0F0F0F]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {item.value}
          </p>
          <p className="text-xs tracking-wider uppercase text-[#0F0F0F]/40 mt-2">
            {item.label}
          </p>
          {item.sublabel && (
            <p className={`text-xs mt-2 ${item.accent ? 'text-[#8B9A7D]' : 'text-[#0F0F0F]/30'}`}>
              {item.sublabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
