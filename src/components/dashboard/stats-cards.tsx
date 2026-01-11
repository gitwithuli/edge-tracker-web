"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, BarChart2, Flame } from "lucide-react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { TRADING_DAYS } from "@/lib/constants";

interface StatsCardsProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
}

export function StatsCards({ logs, edgesWithLogs }: StatsCardsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfWeek;
    });

    // Occurrence stats
    const totalDaysLogged = weekLogs.length;
    const occurrences = weekLogs.filter(l => l.result === "OCCURRED").length;
    const occurrenceRate = totalDaysLogged > 0 ? Math.round((occurrences / totalDaysLogged) * 100) : 0;

    // Calculate previous week for comparison
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

    // Best day (most occurrences all time)
    const dayOccurrences: Record<string, number> = {};
    logs.filter(l => l.result === "OCCURRED").forEach(log => {
      dayOccurrences[log.dayOfWeek] = (dayOccurrences[log.dayOfWeek] || 0) + 1;
    });
    const bestDay = Object.keys(dayOccurrences).length > 0
      ? Object.keys(dayOccurrences).reduce((a, b) => dayOccurrences[a] > dayOccurrences[b] ? a : b)
      : null;

    // Average setups per week
    const allWeekNumbers = new Set<string>();
    logs.forEach(log => {
      const d = new Date(log.date);
      const weekNum = `${d.getFullYear()}-${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
      allWeekNumbers.add(weekNum);
    });
    const totalWeeks = allWeekNumbers.size || 1;
    const totalOccurrences = logs.filter(l => l.result === "OCCURRED").length;
    const avgPerWeek = (totalOccurrences / totalWeeks).toFixed(1);

    // Hot edge (highest occurrence rate with at least 3 logs)
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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900">
            <Calendar className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.totalDaysLogged}</p>
            <p className="text-xs text-zinc-500">days logged</p>
          </div>
        </div>
        <p className="text-xs mt-2 text-zinc-600">
          {stats.occurrences} with setups
        </p>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-900/30">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.occurrenceRate}%</p>
            <p className="text-xs text-zinc-500">occurrence rate</p>
          </div>
        </div>
        {stats.rateDiff !== 0 && (
          <p className={`text-xs mt-2 ${stats.rateDiff > 0 ? "text-emerald-500" : "text-zinc-500"}`}>
            {stats.rateDiff > 0 ? "+" : ""}{stats.rateDiff}% vs last week
          </p>
        )}
      </Card>

      <Card className="bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900">
            <BarChart2 className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.avgPerWeek}</p>
            <p className="text-xs text-zinc-500">avg/week</p>
          </div>
        </div>
        {stats.bestDay && (
          <p className="text-xs mt-2 text-zinc-600">
            Best: {stats.bestDay.slice(0, 3)}
          </p>
        )}
      </Card>

      <Card className="bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-900/30">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-white truncate max-w-[120px]">
              {stats.hotEdge?.name || "—"}
            </p>
            <p className="text-xs text-zinc-500">
              {stats.hotEdge ? `${stats.hotEdge.occurrenceRate}% freq` : "most active"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
