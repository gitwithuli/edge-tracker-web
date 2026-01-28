"use client";

import { useMemo } from "react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { calculateEdgeStats, countTradingDays, formatOccurrenceContext } from "@/lib/edge-stats";

interface StatsCardsProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
}

export function StatsCards({ logs, edgesWithLogs }: StatsCardsProps) {
  const stats = useMemo(() => {
    // Find the earliest edge creation date for aggregate stats
    const earliestCreatedAt = edgesWithLogs.length > 0
      ? edgesWithLogs.reduce((earliest, edge) => {
          if (!edge.createdAt) return earliest;
          if (!earliest) return edge.createdAt;
          return new Date(edge.createdAt) < new Date(earliest) ? edge.createdAt : earliest;
        }, edgesWithLogs[0]?.createdAt)
      : undefined;

    // Use centralized stats calculation with earliest creation date
    const baseStats = calculateEdgeStats(logs, earliestCreatedAt);
    const { totalLogs, occurred: occurrences, occurrenceRate, winRate, wins, losses, tradingDays } = baseStats;

    // For best day calculation, we need the occurred logs
    const occurredLogs = logs.filter(l => l.result === "OCCURRED");

    // Best day calculation from filtered logs
    const dayOccurrences: Record<string, number> = {};
    occurredLogs.forEach(log => {
      dayOccurrences[log.dayOfWeek] = (dayOccurrences[log.dayOfWeek] || 0) + 1;
    });
    const bestDay = Object.keys(dayOccurrences).length > 0
      ? Object.keys(dayOccurrences).reduce((a, b) => dayOccurrences[a] > dayOccurrences[b] ? a : b)
      : null;

    // Calculate average per week
    const totalWeeks = Math.max(1, Math.ceil(tradingDays / 5));
    const avgPerWeek = tradingDays > 0 ? (occurrences / totalWeeks).toFixed(1) : '0';

    // Hot edge - now using trading days calculation
    const edgeStats = edgesWithLogs.map(edge => {
      const edgeLogs = edge.logs;
      const edgeOccurrences = edgeLogs.filter(l => l.result === "OCCURRED").length;
      const edgeTradingDays = edge.createdAt ? countTradingDays(edge.createdAt) : 0;
      return {
        name: edge.name,
        occurrenceRate: edgeTradingDays >= 3 ? Math.round((edgeOccurrences / edgeTradingDays) * 100) : 0,
        tradingDays: edgeTradingDays,
      };
    }).filter(e => e.tradingDays >= 3);

    const hotEdge = edgeStats.length > 0
      ? edgeStats.reduce((a, b) => a.occurrenceRate > b.occurrenceRate ? a : b)
      : null;

    return {
      totalLogs,
      occurrences,
      occurrenceRate,
      bestDay,
      avgPerWeek,
      hotEdge,
      tradingDays,
      winRate,
      wins,
      losses,
    };
  }, [logs, edgesWithLogs]);

  const statItems = [
    {
      value: stats.occurrences.toString(),
      label: "Occurrences",
      sublabel: stats.tradingDays > 0 ? `in ${stats.tradingDays} trading days` : null,
      accent: false,
    },
    {
      value: `${stats.occurrenceRate}%`,
      label: "Occurrence Rate",
      sublabel: stats.tradingDays > 0 ? formatOccurrenceContext(stats.occurrences, stats.tradingDays) : null,
      accent: stats.occurrenceRate >= 30,
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
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 hover:border-[#0F0F0F]/10 dark:hover:border-white/20 transition-colors duration-300"
        >
          <p
            className="text-3xl sm:text-4xl tracking-tight text-[#0F0F0F] dark:text-white"
            style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
          >
            {item.value}
          </p>
          <p className="text-xs tracking-wider uppercase text-[#0F0F0F]/50 dark:text-white/50 mt-2">
            {item.label}
          </p>
          {item.sublabel && (
            <p className={`text-xs mt-2 ${item.accent ? 'text-[#8B9A7D]' : 'text-[#0F0F0F]/50 dark:text-white/50'}`}>
              {item.sublabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
