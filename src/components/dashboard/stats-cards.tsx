"use client";

import { useMemo } from "react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";

interface StatsCardsProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
}

export function StatsCards({ logs, edgesWithLogs }: StatsCardsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfWeek;
    });

    const totalDaysLogged = weekLogs.length;
    const occurrences = weekLogs.filter(l => l.result === "OCCURRED").length;
    const occurrenceRate = totalDaysLogged > 0 ? Math.round((occurrences / totalDaysLogged) * 100) : 0;

    const prevWeekStart = new Date(startOfWeek);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= prevWeekStart && logDate < startOfWeek;
    });
    const prevWeekOccurrences = prevWeekLogs.filter(l => l.result === "OCCURRED").length;
    const prevWeekTotal = prevWeekLogs.length;
    const prevWeekRate = prevWeekTotal > 0 ? Math.round((prevWeekOccurrences / prevWeekTotal) * 100) : 0;
    const rateDiff = occurrenceRate - prevWeekRate;

    const dayOccurrences: Record<string, number> = {};
    logs.filter(l => l.result === "OCCURRED").forEach(log => {
      dayOccurrences[log.dayOfWeek] = (dayOccurrences[log.dayOfWeek] || 0) + 1;
    });
    const bestDay = Object.keys(dayOccurrences).length > 0
      ? Object.keys(dayOccurrences).reduce((a, b) => dayOccurrences[a] > dayOccurrences[b] ? a : b)
      : null;

    const allWeekNumbers = new Set<string>();
    logs.forEach(log => {
      const d = new Date(log.date);
      const weekNum = `${d.getFullYear()}-${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
      allWeekNumbers.add(weekNum);
    });
    const totalWeeks = allWeekNumbers.size || 1;
    const totalOccurrences = logs.filter(l => l.result === "OCCURRED").length;
    const avgPerWeek = (totalOccurrences / totalWeeks).toFixed(1);

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
      rateDiff,
      bestDay,
      avgPerWeek,
      hotEdge,
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
      sublabel: stats.rateDiff !== 0 ? `${stats.rateDiff > 0 ? "+" : ""}${stats.rateDiff}% vs last week` : null,
      accent: stats.rateDiff > 0,
    },
    {
      value: stats.avgPerWeek,
      label: "Weekly Average",
      sublabel: stats.bestDay ? `Best: ${stats.bestDay.slice(0, 3)}` : null,
      accent: false,
    },
    {
      value: stats.hotEdge?.name || "—",
      label: "Most Active",
      sublabel: stats.hotEdge ? `${stats.hotEdge.occurrenceRate}% frequency` : null,
      accent: false,
      isText: true,
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
            className={`${item.isText ? 'text-xl sm:text-2xl truncate' : 'text-3xl sm:text-4xl'} tracking-tight text-[#0F0F0F]`}
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
