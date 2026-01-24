"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { ArrowLeft, Play, Rewind, Plus, TrendingUp, TrendingDown, Target, Clock, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Layers, ChevronRight, Loader2, Share2 } from "lucide-react";
import { getSymbolInfo } from "@/lib/constants";
import { formatCurrencyCompact } from "@/lib/utils";
import { LogDialog } from "@/components/log-dialog";
import { HistorySheet } from "@/components/history-sheet";
import { EdgeFormDialog } from "@/components/edge-form-dialog";
import {
  DateRangeFilter,
  filterLogsByDateRange,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-filter";
import { TRADING_DAYS } from "@/lib/constants";
import type { LogType } from "@/lib/types";
import Link from "next/link";
import { GrainOverlay } from "@/components/grain-overlay";
import { ShareCardDialog } from "@/components/share-card-dialog";

export default function EdgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const edgeId = params.id as string;

  const { edges, logs, isLoaded, user, addLog, deleteLog, updateLog, getSubEdges, getParentEdge } = useEdgeStore();
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<LogType>("FRONTTEST");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  // Get log ID from URL query param for auto-opening history
  const highlightLogId = searchParams.get('log');
  const [historyOpen, setHistoryOpen] = useState(!!highlightLogId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const edge = useMemo(() => edges.find(e => e.id === edgeId), [edges, edgeId]);

  // Get sub-edges and parent edge
  const subEdges = useMemo(() => getSubEdges(edgeId), [edgeId, getSubEdges, edges]);
  const parentEdge = useMemo(() => getParentEdge(edgeId), [edgeId, getParentEdge, edges]);
  const hasSubEdges = subEdges.length > 0;

  // Include sub-edge logs in the stats when this is a parent edge
  const edgeLogs = useMemo(() => {
    const thisEdgeLogs = logs.filter(l => l.edgeId === edgeId);
    if (hasSubEdges) {
      // Include logs from all sub-edges
      const subEdgeIds = subEdges.map(e => e.id);
      const subEdgeLogs = logs.filter(l => subEdgeIds.includes(l.edgeId));
      return [...thisEdgeLogs, ...subEdgeLogs];
    }
    return thisEdgeLogs;
  }, [logs, edgeId, hasSubEdges, subEdges]);

  const filteredLogs = useMemo(() => {
    const logsByType = edgeLogs.filter(l => (l.logType || 'FRONTTEST') === activeView);
    return filterLogsByDateRange(logsByType, dateRange);
  }, [edgeLogs, activeView, dateRange]);

  const stats = useMemo(() => {
    const totalLogs = filteredLogs.length;
    const occurred = filteredLogs.filter(l => l.result === "OCCURRED");
    const occurrences = occurred.length;
    const occurrenceRate = totalLogs > 0 ? Math.round((occurrences / totalLogs) * 100) : 0;

    const wins = occurred.filter(l => l.outcome === "WIN").length;
    const losses = occurred.filter(l => l.outcome === "LOSS").length;
    const winRate = occurrences > 0 ? Math.round((wins / occurrences) * 100) : 0;

    const avgDuration = occurrences > 0
      ? Math.round(occurred.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / occurrences)
      : 0;

    const dayOccurrences: Record<string, { occurred: number; total: number }> = {};
    TRADING_DAYS.forEach(day => {
      dayOccurrences[day] = { occurred: 0, total: 0 };
    });

    filteredLogs.forEach(log => {
      if (dayOccurrences[log.dayOfWeek]) {
        dayOccurrences[log.dayOfWeek].total++;
        if (log.result === 'OCCURRED') {
          dayOccurrences[log.dayOfWeek].occurred++;
        }
      }
    });

    const bestDay = Object.entries(dayOccurrences)
      .filter(([, data]) => data.total >= 2)
      .sort((a, b) => {
        const rateA = a[1].total > 0 ? a[1].occurred / a[1].total : 0;
        const rateB = b[1].total > 0 ? b[1].occurred / b[1].total : 0;
        return rateB - rateA;
      })[0];

    const hasPriceTracking = edge?.enabledFields?.includes('entryExitPrices') ?? false;

    let pnl: number | null = null;
    let dollarPnl: number | null = null;
    let longStats: { count: number; wins: number; winRate: number; pnl: number; dollarPnl: number | null } | null = null;
    let shortStats: { count: number; wins: number; winRate: number; pnl: number; dollarPnl: number | null } | null = null;

    if (hasPriceTracking) {
      const logsWithPrices = occurred.filter(
        (l) => l.entryPrice != null && l.exitPrice != null && l.direction != null
      );
      if (logsWithPrices.length > 0) {
        let totalDollarPnl = 0;
        let hasDollarPnl = false;

        pnl = logsWithPrices.reduce((sum, l) => {
          const entry = l.entryPrice as number;
          const exit = l.exitPrice as number;
          const tradePnl = l.direction === 'LONG' ? exit - entry : entry - exit;
          const contracts = l.positionSize || 1;
          const symbolInfo = l.symbol ? getSymbolInfo(l.symbol) : null;
          if (symbolInfo) {
            totalDollarPnl += tradePnl * symbolInfo.multiplier * contracts;
            hasDollarPnl = true;
          }
          return sum + tradePnl;
        }, 0);

        if (hasDollarPnl) {
          dollarPnl = totalDollarPnl;
        }

        // Calculate Long stats
        const longLogs = logsWithPrices.filter((l) => l.direction === 'LONG');
        if (longLogs.length > 0) {
          const longWins = longLogs.filter((l) => l.outcome === 'WIN').length;
          let longDollarPnl = 0;
          let hasLongDollarPnl = false;
          const longPnl = longLogs.reduce((sum, l) => {
            const tradePnl = (l.exitPrice as number) - (l.entryPrice as number);
            const contracts = l.positionSize || 1;
            const symbolInfo = l.symbol ? getSymbolInfo(l.symbol) : null;
            if (symbolInfo) {
              longDollarPnl += tradePnl * symbolInfo.multiplier * contracts;
              hasLongDollarPnl = true;
            }
            return sum + tradePnl;
          }, 0);
          longStats = {
            count: longLogs.length,
            wins: longWins,
            winRate: Math.round((longWins / longLogs.length) * 100),
            pnl: longPnl,
            dollarPnl: hasLongDollarPnl ? longDollarPnl : null,
          };
        }

        // Calculate Short stats
        const shortLogs = logsWithPrices.filter((l) => l.direction === 'SHORT');
        if (shortLogs.length > 0) {
          const shortWins = shortLogs.filter((l) => l.outcome === 'WIN').length;
          let shortDollarPnl = 0;
          let hasShortDollarPnl = false;
          const shortPnl = shortLogs.reduce((sum, l) => {
            const tradePnl = (l.entryPrice as number) - (l.exitPrice as number);
            const contracts = l.positionSize || 1;
            const symbolInfo = l.symbol ? getSymbolInfo(l.symbol) : null;
            if (symbolInfo) {
              shortDollarPnl += tradePnl * symbolInfo.multiplier * contracts;
              hasShortDollarPnl = true;
            }
            return sum + tradePnl;
          }, 0);
          shortStats = {
            count: shortLogs.length,
            wins: shortWins,
            winRate: Math.round((shortWins / shortLogs.length) * 100),
            pnl: shortPnl,
            dollarPnl: hasShortDollarPnl ? shortDollarPnl : null,
          };
        }
      }
    }

    // Calculate average risk (distance from entry to stop loss)
    let avgRisk: number | null = null;
    let avgDollarRisk: number | null = null;
    if (hasPriceTracking) {
      const logsWithRisk = occurred.filter(
        (l) => l.entryPrice != null && l.stopLoss != null && l.direction != null
      );
      if (logsWithRisk.length > 0) {
        let totalDollarRisk = 0;
        let hasDollarRisk = false;

        const totalRisk = logsWithRisk.reduce((sum, l) => {
          const entry = l.entryPrice as number;
          const stop = l.stopLoss as number;
          const risk = l.direction === 'LONG' ? entry - stop : stop - entry;
          const contracts = l.positionSize || 1;
          const symbolInfo = l.symbol ? getSymbolInfo(l.symbol) : null;
          if (symbolInfo) {
            totalDollarRisk += Math.abs(risk) * symbolInfo.multiplier * contracts;
            hasDollarRisk = true;
          }
          return sum + Math.abs(risk);
        }, 0);

        avgRisk = totalRisk / logsWithRisk.length;
        if (hasDollarRisk) {
          avgDollarRisk = totalDollarRisk / logsWithRisk.length;
        }
      }
    }

    return {
      totalLogs,
      occurrences,
      occurrenceRate,
      wins,
      losses,
      winRate,
      avgDuration,
      dayOccurrences,
      bestDay: bestDay ? { day: bestDay[0], ...bestDay[1] } : null,
      pnl,
      dollarPnl,
      hasPriceTracking,
      longStats,
      shortStats,
      avgRisk,
      avgDollarRisk,
    };
  }, [filteredLogs, edge]);

  // Redirect to login if not authenticated (after auth has loaded)
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/login');
    }
  }, [isLoaded, user, router]);

  // Show loading spinner while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/40 dark:text-white/40" />
      </div>
    );
  }

  // Show loading while redirect is in progress
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/40 dark:text-white/40" />
      </div>
    );
  }

  if (!edge) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-[#0F0F0F] dark:text-white mb-4" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            Edge not found
          </h1>
          <Link href="/dashboard" className="text-[#C45A3B] text-sm hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isBacktest = activeView === "BACKTEST";

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.6s ease-out forwards;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white selection:bg-[#C45A3B]/20 transition-colors duration-300">
        {/* Header */}
        <header className="border-b border-[#0F0F0F]/5 dark:border-white/10 bg-[#FAF7F2]/80 dark:bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 py-4 flex justify-between items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#0F0F0F]/60 dark:text-white/60 hover:text-[#0F0F0F] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>

            <LogDialog
              edgeName={hasSubEdges ? undefined : edge.name}
              edgeId={hasSubEdges ? undefined : edge.id}
              parentEdgeId={hasSubEdges ? edge.id : undefined}
              defaultLogType={activeView}
              onSave={(data, newEdgeId) => addLog(newEdgeId || edge.id, data)}
              trigger={
                <button className="inline-flex items-center gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Log {isBacktest ? 'Backtest' : 'Day'}</span>
                </button>
              }
            />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          {/* Edge Title */}
          <div
            className={`mb-8 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            {/* Parent Edge Link */}
            {parentEdge && (
              <Link
                href={`/edge/${parentEdge.id}`}
                className="inline-flex items-center gap-2 text-xs text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#C45A3B] transition-colors mb-3"
              >
                <Layers className="w-3 h-3" />
                <span>Part of <span className="font-medium">{parentEdge.name}</span></span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            <p className="text-[#C45A3B] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {hasSubEdges ? 'Edge Group' : 'Edge Performance'}
            </p>
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="text-3xl sm:text-4xl tracking-tight mb-2 text-[#0F0F0F] dark:text-white"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {edge.name}
                </h1>
                {edge.description && (
                  <p className="text-[#0F0F0F]/50 dark:text-white/50 text-sm max-w-lg">{edge.description}</p>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Share Card Button */}
                <ShareCardDialog
                  edge={edge}
                  stats={stats}
                  trigger={
                    <button className="flex items-center gap-2 text-xs text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#C45A3B] transition-colors border border-[#0F0F0F]/10 dark:border-white/10 hover:border-[#C45A3B]/30 px-3 py-1.5 rounded-full">
                      <Share2 className="w-3 h-3" />
                      Share
                    </button>
                  }
                />
                {/* Add Sub-Edge Button - only show if this edge has no parent (can be a parent) */}
                {!edge.parentEdgeId && (
                  <EdgeFormDialog
                    defaultParentEdgeId={edge.id}
                    trigger={
                      <button className="flex items-center gap-2 text-xs text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#C45A3B] transition-colors border border-[#0F0F0F]/10 dark:border-white/10 hover:border-[#C45A3B]/30 px-3 py-1.5 rounded-full">
                        <Plus className="w-3 h-3" />
                        Add Sub-Edge
                      </button>
                    }
                  />
                )}
              </div>
            </div>
            {/* Sub-edges indicator */}
            {hasSubEdges && (
              <div className="flex items-center gap-2 mt-3">
                <Layers className="w-4 h-4 text-[#C45A3B]" />
                <span className="text-xs text-[#0F0F0F]/50 dark:text-white/50">
                  {subEdges.length} sub-edge{subEdges.length !== 1 ? 's' : ''} • Combined stats shown below
                </span>
              </div>
            )}
          </div>

          {/* Sub-edges Grid (if parent edge) */}
          {hasSubEdges && (
            <div
              className={`mb-8 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.15s' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-sm tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">
                  Sub-Edges
                </h3>
                <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subEdges.map(subEdge => {
                  const subEdgeLogs = logs.filter(l => l.edgeId === subEdge.id);
                  const subOccurred = subEdgeLogs.filter(l => l.result === 'OCCURRED');
                  const subWins = subOccurred.filter(l => l.outcome === 'WIN').length;
                  const subWinRate = subOccurred.length > 0 ? Math.round((subWins / subOccurred.length) * 100) : 0;
                  return (
                    <Link
                      key={subEdge.id}
                      href={`/edge/${subEdge.id}`}
                      className="p-4 rounded-xl bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 hover:border-[#C45A3B]/30 transition-all group"
                    >
                      <p className="text-sm font-medium text-[#0F0F0F] dark:text-white group-hover:text-[#C45A3B] transition-colors mb-1">
                        {subEdge.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#0F0F0F]/40 dark:text-white/40">
                        <span>{subEdgeLogs.length} days</span>
                        <span>•</span>
                        <span className={subWinRate >= 50 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}>
                          {subWinRate}% WR
                        </span>
                        <span>•</span>
                        <span className="text-[#8B9A7D]">{subWins}W</span>
                        <span className="text-[#C45A3B]">{subOccurred.length - subWins}L</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Toggle + Date Filter */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center gap-4 mb-8 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex p-1 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-full">
              <button
                onClick={() => setActiveView("FRONTTEST")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeView === "FRONTTEST"
                    ? "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] shadow-sm"
                    : "text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white"
                }`}
              >
                <Play className="w-4 h-4" />
                Live
              </button>
              <button
                onClick={() => setActiveView("BACKTEST")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeView === "BACKTEST"
                    ? "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] shadow-sm"
                    : "text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white"
                }`}
              >
                <Rewind className="w-4 h-4" />
                Backtest
              </button>
            </div>

            <div className="flex items-center gap-3 sm:ml-auto">
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
              {filteredLogs.length !== edgeLogs.filter(l => (l.logType || 'FRONTTEST') === activeView).length && (
                <span className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                  {filteredLogs.length} of {edgeLogs.filter(l => (l.logType || 'FRONTTEST') === activeView).length}
                </span>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.3s' }}
          >
            <div className="bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#8B9A7D]" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Occurrence</span>
              </div>
              <p
                className="text-2xl sm:text-3xl font-medium text-[#0F0F0F] dark:text-white"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {stats.occurrenceRate}%
              </p>
              <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">{stats.occurrences} of {stats.totalLogs} days</p>
            </div>

            <div className="bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#8B9A7D]" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Win Rate</span>
              </div>
              <p
                className="text-2xl sm:text-3xl font-medium text-[#0F0F0F] dark:text-white"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {stats.winRate}%
              </p>
              <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                <span className="text-[#8B9A7D]">{stats.wins}W</span>
                {' / '}
                <span className="text-[#C45A3B]">{stats.losses}L</span>
              </p>
            </div>

            <div className="bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Avg Duration</span>
              </div>
              <p
                className="text-2xl sm:text-3xl font-medium text-[#0F0F0F] dark:text-white"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {stats.avgDuration}m
              </p>
              <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">per occurrence</p>
            </div>

            <div className="bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#C45A3B]" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Best Day</span>
              </div>
              {stats.bestDay ? (
                <>
                  <p
                    className="text-lg sm:text-xl font-medium text-[#0F0F0F] dark:text-white"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {stats.bestDay.day}
                  </p>
                  <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                    {Math.round((stats.bestDay.occurred / stats.bestDay.total) * 100)}% ({stats.bestDay.occurred}/{stats.bestDay.total})
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#0F0F0F]/40 dark:text-white/40">Need more data</p>
              )}
            </div>

            {/* P&L Card - only shown when price tracking is enabled */}
            {stats.hasPriceTracking && stats.pnl !== null && (
              <div className="bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`w-4 h-4 ${(stats.dollarPnl ?? stats.pnl) >= 0 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`} />
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">
                    Total P&L
                  </span>
                </div>
                {stats.dollarPnl !== null ? (
                  <>
                    <p
                      className={`text-2xl sm:text-3xl font-medium ${stats.dollarPnl >= 0 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`}
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {formatCurrencyCompact(stats.dollarPnl)}
                    </p>
                    <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)} pts</p>
                  </>
                ) : (
                  <>
                    <p
                      className={`text-2xl sm:text-3xl font-medium ${stats.pnl >= 0 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`}
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">points (no symbol set)</p>
                  </>
                )}
              </div>
            )}

            {/* Average Risk Card - only shown when price tracking is enabled and has risk data */}
            {stats.hasPriceTracking && stats.avgRisk !== null && (
              <div className="bg-white dark:bg-white/5 border border-[#C45A3B]/20 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-[#C45A3B]" />
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">
                    Avg Risk
                  </span>
                </div>
                {stats.avgDollarRisk !== null ? (
                  <>
                    <p
                      className="text-2xl sm:text-3xl font-medium text-[#C45A3B]"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      ${stats.avgDollarRisk >= 1000 ? `${(stats.avgDollarRisk / 1000).toFixed(1)}k` : Math.round(stats.avgDollarRisk)}
                    </p>
                    <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">{stats.avgRisk.toFixed(2)} pts per trade</p>
                  </>
                ) : (
                  <>
                    <p
                      className="text-2xl sm:text-3xl font-medium text-[#C45A3B]"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {stats.avgRisk.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">points per trade</p>
                  </>
                )}
              </div>
            )}

            {/* Long Stats Card */}
            {stats.hasPriceTracking && stats.longStats && (
              <div className="bg-white dark:bg-white/5 border border-[#8B9A7D]/20 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-4 h-4 text-[#8B9A7D]" />
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Long Trades</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p
                    className="text-2xl sm:text-3xl font-medium text-[#0F0F0F] dark:text-white"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {stats.longStats.winRate}%
                  </p>
                  <span className={`text-sm font-medium ${stats.longStats.pnl >= 0 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`}>
                    {stats.longStats.dollarPnl !== null
                      ? formatCurrencyCompact(stats.longStats.dollarPnl)
                      : `${stats.longStats.pnl >= 0 ? '+' : ''}${stats.longStats.pnl.toFixed(2)}`
                    }
                  </span>
                </div>
                <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                  <span className="text-[#8B9A7D]">{stats.longStats.wins}W</span>
                  {' / '}
                  <span className="text-[#C45A3B]">{stats.longStats.count - stats.longStats.wins}L</span>
                  {' • '}{stats.longStats.count} trades
                </p>
              </div>
            )}

            {/* Short Stats Card */}
            {stats.hasPriceTracking && stats.shortStats && (
              <div className="bg-white dark:bg-white/5 border border-[#C45A3B]/20 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className="w-4 h-4 text-[#C45A3B]" />
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Short Trades</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p
                    className="text-2xl sm:text-3xl font-medium text-[#0F0F0F] dark:text-white"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {stats.shortStats.winRate}%
                  </p>
                  <span className={`text-sm font-medium ${stats.shortStats.pnl >= 0 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`}>
                    {stats.shortStats.dollarPnl !== null
                      ? formatCurrencyCompact(stats.shortStats.dollarPnl)
                      : `${stats.shortStats.pnl >= 0 ? '+' : ''}${stats.shortStats.pnl.toFixed(2)}`
                    }
                  </span>
                </div>
                <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                  <span className="text-[#8B9A7D]">{stats.shortStats.wins}W</span>
                  {' / '}
                  <span className="text-[#C45A3B]">{stats.shortStats.count - stats.shortStats.wins}L</span>
                  {' • '}{stats.shortStats.count} trades
                </p>
              </div>
            )}
          </div>

          {/* Occurrence by Day Chart */}
          <div
            className={`bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-6 sm:p-8 mb-8 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <h3
                className="text-lg tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Occurrence by Day
              </h3>
              <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />
            </div>

            {stats.totalLogs === 0 ? (
              <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm py-8 text-center">
                No days logged yet. Start tracking to see patterns.
              </p>
            ) : (
              <div className="space-y-4">
                {TRADING_DAYS.map(day => {
                  const data = stats.dayOccurrences[day];
                  const rate = data.total > 0 ? (data.occurred / data.total) * 100 : 0;
                  const isBestDay = stats.bestDay?.day === day;

                  return (
                    <div key={day} className="flex items-center gap-4">
                      <span className={`w-12 text-xs font-medium ${isBestDay ? 'text-[#C45A3B]' : 'text-[#0F0F0F]/50 dark:text-white/50'} uppercase tracking-wider`}>
                        {day.slice(0, 3)}
                      </span>
                      <div className="flex-1 h-8 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-lg overflow-hidden relative">
                        {data.total > 0 && (
                          <div
                            className={`h-full transition-all duration-700 ease-out rounded-lg ${
                              isBestDay ? 'bg-[#C45A3B]' : 'bg-[#8B9A7D]'
                            }`}
                            style={{ width: `${Math.max(rate, 2)}%` }}
                          />
                        )}
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-[#0F0F0F]/70 dark:text-white/70">
                          {data.total > 0 ? `${Math.round(rate)}%` : "—"}
                          {data.total > 0 && (
                            <span className="text-[#0F0F0F]/30 dark:text-white/30 ml-1">
                              ({data.occurred}/{data.total})
                            </span>
                          )}
                        </span>
                      </div>
                      {isBestDay && (
                        <span className="text-xs text-[#C45A3B] font-medium tracking-wider uppercase">
                          Peak
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          <div
            className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.5s' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3
                  className="text-lg tracking-tight"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Log History
                </h3>
                <div className="h-px w-12 bg-[#0F0F0F]/10 dark:bg-white/10" />
              </div>
              <HistorySheet
                edge={{ ...edge, logs: filteredLogs }}
                onDeleteLog={deleteLog}
                onUpdateLog={updateLog}
                defaultOpen={historyOpen}
                highlightLogId={highlightLogId}
                onOpenChange={(open) => {
                  setHistoryOpen(open);
                  // Clear the URL param when dialog closes
                  if (!open && highlightLogId) {
                    router.replace(`/edge/${edgeId}`, { scroll: false });
                  }
                }}
              />
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-[#0F0F0F]/10 dark:border-white/10 text-center">
                <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm">
                  No {isBacktest ? 'backtest' : 'live'} logs yet for this edge.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.slice(0, 10).map(log => {
                  const hasPrices = log.entryPrice != null && log.exitPrice != null && log.direction;
                  let tradePnl: number | null = null;
                  let dollarPnl: number | null = null;

                  if (hasPrices) {
                    const entry = log.entryPrice as number;
                    const exit = log.exitPrice as number;
                    tradePnl = log.direction === 'LONG' ? exit - entry : entry - exit;
                    const contracts = log.positionSize || 1;
                    const symbolInfo = log.symbol ? getSymbolInfo(log.symbol) : null;
                    if (symbolInfo) {
                      dollarPnl = tradePnl * symbolInfo.multiplier * contracts;
                    }
                  }

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-white dark:bg-white/5 border border-[#0F0F0F]/5 dark:border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.result === "OCCURRED"
                            ? log.outcome === "WIN" ? "bg-[#8B9A7D]" : "bg-[#C45A3B]"
                            : "bg-[#0F0F0F]/20 dark:bg-white/20"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-[#0F0F0F] dark:text-white">
                            {log.result === "OCCURRED" ? (
                              <span className="flex items-center gap-1">
                                {log.outcome === "WIN" ? (
                                  <><TrendingUp className="w-3 h-3 text-[#8B9A7D]" /> Win</>
                                ) : (
                                  <><TrendingDown className="w-3 h-3 text-[#C45A3B]" /> Loss</>
                                )}
                              </span>
                            ) : (
                              "No Setup"
                            )}
                          </p>
                          <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                            {log.dayOfWeek} • {log.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        {log.result === "OCCURRED" && tradePnl !== null && (
                          <div>
                            <p className={`text-sm font-medium ${tradePnl >= 0 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`}>
                              {tradePnl >= 0 ? '+' : ''}{tradePnl.toFixed(2)} pts
                            </p>
                            {dollarPnl !== null && (
                              <p className="text-[10px] text-[#0F0F0F]/30 dark:text-white/30">
                                {formatCurrencyCompact(dollarPnl)}
                              </p>
                            )}
                          </div>
                        )}
                        {log.result === "OCCURRED" && (
                          <span className="text-xs text-[#0F0F0F]/40 dark:text-white/40 min-w-[32px]">{log.durationMinutes}m</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredLogs.length > 10 && (
                  <p className="text-center text-xs text-[#0F0F0F]/40 dark:text-white/40 pt-2">
                    +{filteredLogs.length - 10} more entries
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0F0F0F]/5 dark:border-white/10 py-6 mt-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/30 dark:text-white/30">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase"><img src="/logo-icon-transparent.png" alt="" className="w-5 h-5" />Edge of ICT</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>
    </>
  );
}
