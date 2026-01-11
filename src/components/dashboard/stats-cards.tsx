"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, Flame } from "lucide-react";
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

    const totalTrades = weekLogs.length;
    const wins = weekLogs.filter(l => l.result === "WIN").length;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

    // Calculate previous week for comparison
    const prevWeekStart = new Date(startOfWeek);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= prevWeekStart && logDate < startOfWeek;
    });
    const prevWeekTrades = prevWeekLogs.length;
    const prevWeekWins = prevWeekLogs.filter(l => l.result === "WIN").length;
    const prevWeekWinRate = prevWeekTrades > 0 ? Math.round((prevWeekWins / prevWeekTrades) * 100) : 0;

    const tradesDiff = totalTrades - prevWeekTrades;
    const winRateDiff = winRate - prevWeekWinRate;

    // Best day calculation (all time wins by day)
    const dayWins: Record<string, number> = {};
    logs.filter(l => l.result === "WIN").forEach(log => {
      dayWins[log.dayOfWeek] = (dayWins[log.dayOfWeek] || 0) + 1;
    });
    const bestDay = Object.keys(dayWins).length > 0
      ? Object.keys(dayWins).reduce((a, b) => dayWins[a] > dayWins[b] ? a : b)
      : null;

    // Hot edge (highest win rate this week with at least 2 trades)
    const edgeStats = edgesWithLogs.map(edge => {
      const edgeWeekLogs = weekLogs.filter(l => l.edgeId === edge.id);
      const edgeWins = edgeWeekLogs.filter(l => l.result === "WIN").length;
      const edgeTotal = edgeWeekLogs.length;
      return {
        name: edge.name,
        winRate: edgeTotal >= 2 ? Math.round((edgeWins / edgeTotal) * 100) : 0,
        trades: edgeTotal,
      };
    }).filter(e => e.trades >= 2);

    const hotEdge = edgeStats.length > 0
      ? edgeStats.reduce((a, b) => a.winRate > b.winRate ? a : b)
      : null;

    return {
      totalTrades,
      tradesDiff,
      winRate,
      winRateDiff,
      bestDay,
      hotEdge,
    };
  }, [logs, edgesWithLogs]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
            <p className="text-xs text-zinc-500">trades this week</p>
          </div>
        </div>
        {stats.tradesDiff !== 0 && (
          <p className={`text-xs mt-2 ${stats.tradesDiff > 0 ? "text-green-500" : "text-red-500"}`}>
            {stats.tradesDiff > 0 ? "+" : ""}{stats.tradesDiff} vs last week
          </p>
        )}
      </Card>

      <Card className="bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${stats.winRate >= 50 ? "bg-green-900/30" : "bg-red-900/30"}`}>
            {stats.winRate >= 50 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
            <p className="text-xs text-zinc-500">win rate</p>
          </div>
        </div>
        {stats.winRateDiff !== 0 && (
          <p className={`text-xs mt-2 ${stats.winRateDiff > 0 ? "text-green-500" : "text-red-500"}`}>
            {stats.winRateDiff > 0 ? "+" : ""}{stats.winRateDiff}% vs last week
          </p>
        )}
      </Card>

      <Card className="bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900">
            <Calendar className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {stats.bestDay ? stats.bestDay.slice(0, 3) : "—"}
            </p>
            <p className="text-xs text-zinc-500">best day</p>
          </div>
        </div>
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
              {stats.hotEdge ? `${stats.hotEdge.winRate}% this week` : "hot edge"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
