"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { ArrowLeft, Play, Rewind, Plus, TrendingUp, TrendingDown, Target, Clock, Calendar } from "lucide-react";
import { LogDialog } from "@/components/log-dialog";
import { HistorySheet } from "@/components/history-sheet";
import {
  DateRangeFilter,
  filterLogsByDateRange,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-filter";
import { TRADING_DAYS } from "@/lib/constants";
import type { LogType } from "@/lib/types";
import Link from "next/link";

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

export default function EdgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const edgeId = params.id as string;

  const { edges, logs, isLoaded, user, addLog, deleteLog, updateLog } = useEdgeStore();
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<LogType>("FRONTTEST");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  useEffect(() => {
    setMounted(true);
  }, []);

  const edge = useMemo(() => edges.find(e => e.id === edgeId), [edges, edgeId]);

  const edgeLogs = useMemo(() => logs.filter(l => l.edgeId === edgeId), [logs, edgeId]);

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
    };
  }, [filteredLogs]);

  if (!isLoaded || !user) {
    return null;
  }

  if (!edge) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl mb-4" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
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

      <div className="min-h-screen bg-[#FAF7F2] text-[#0F0F0F] selection:bg-[#C45A3B]/20">
        {/* Header */}
        <header className="border-b border-[#0F0F0F]/5 bg-[#FAF7F2]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 py-4 flex justify-between items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#0F0F0F]/60 hover:text-[#0F0F0F] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>

            <LogDialog
              edgeName={edge.name}
              defaultLogType={activeView}
              onSave={(data) => addLog(edge.id, data)}
              trigger={
                <button className="inline-flex items-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
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
            <p className="text-[#C45A3B] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              Edge Performance
            </p>
            <h1
              className="text-3xl sm:text-4xl tracking-tight mb-2"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {edge.name}
            </h1>
            {edge.description && (
              <p className="text-[#0F0F0F]/50 text-sm max-w-lg">{edge.description}</p>
            )}
          </div>

          {/* View Toggle + Date Filter */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center gap-4 mb-8 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex p-1 bg-[#0F0F0F]/5 rounded-full">
              <button
                onClick={() => setActiveView("FRONTTEST")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeView === "FRONTTEST"
                    ? "bg-[#0F0F0F] text-[#FAF7F2] shadow-sm"
                    : "text-[#0F0F0F]/50 hover:text-[#0F0F0F]"
                }`}
              >
                <Play className="w-4 h-4" />
                Live
              </button>
              <button
                onClick={() => setActiveView("BACKTEST")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeView === "BACKTEST"
                    ? "bg-[#0F0F0F] text-[#FAF7F2] shadow-sm"
                    : "text-[#0F0F0F]/50 hover:text-[#0F0F0F]"
                }`}
              >
                <Rewind className="w-4 h-4" />
                Backtest
              </button>
            </div>

            <div className="flex items-center gap-3 sm:ml-auto">
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
              {filteredLogs.length !== edgeLogs.filter(l => (l.logType || 'FRONTTEST') === activeView).length && (
                <span className="text-xs text-[#0F0F0F]/40">
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
            <div className="bg-white border border-[#0F0F0F]/5 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#8B9A7D]" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Occurrence</span>
              </div>
              <p
                className="text-2xl sm:text-3xl font-medium text-[#0F0F0F]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {stats.occurrenceRate}%
              </p>
              <p className="text-xs text-[#0F0F0F]/40">{stats.occurrences} of {stats.totalLogs} days</p>
            </div>

            <div className="bg-white border border-[#0F0F0F]/5 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#8B9A7D]" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Win Rate</span>
              </div>
              <p
                className="text-2xl sm:text-3xl font-medium text-[#0F0F0F]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {stats.winRate}%
              </p>
              <p className="text-xs text-[#0F0F0F]/40">
                <span className="text-[#8B9A7D]">{stats.wins}W</span>
                {' / '}
                <span className="text-[#C45A3B]">{stats.losses}L</span>
              </p>
            </div>

            <div className="bg-white border border-[#0F0F0F]/5 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#0F0F0F]/30" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Avg Duration</span>
              </div>
              <p
                className="text-2xl sm:text-3xl font-medium text-[#0F0F0F]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {stats.avgDuration}m
              </p>
              <p className="text-xs text-[#0F0F0F]/40">per occurrence</p>
            </div>

            <div className="bg-white border border-[#0F0F0F]/5 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#C45A3B]" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Best Day</span>
              </div>
              {stats.bestDay ? (
                <>
                  <p
                    className="text-lg sm:text-xl font-medium text-[#0F0F0F]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {stats.bestDay.day}
                  </p>
                  <p className="text-xs text-[#0F0F0F]/40">
                    {Math.round((stats.bestDay.occurred / stats.bestDay.total) * 100)}% ({stats.bestDay.occurred}/{stats.bestDay.total})
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#0F0F0F]/40">Need more data</p>
              )}
            </div>
          </div>

          {/* Occurrence by Day Chart */}
          <div
            className={`bg-white border border-[#0F0F0F]/5 rounded-2xl p-6 sm:p-8 mb-8 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <h3
                className="text-lg tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Occurrence by Day
              </h3>
              <div className="flex-1 h-px bg-[#0F0F0F]/10" />
            </div>

            {stats.totalLogs === 0 ? (
              <p className="text-[#0F0F0F]/40 text-sm py-8 text-center">
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
                      <span className={`w-12 text-xs font-medium ${isBestDay ? 'text-[#C45A3B]' : 'text-[#0F0F0F]/50'} uppercase tracking-wider`}>
                        {day.slice(0, 3)}
                      </span>
                      <div className="flex-1 h-8 bg-[#0F0F0F]/5 rounded-lg overflow-hidden relative">
                        {data.total > 0 && (
                          <div
                            className={`h-full transition-all duration-700 ease-out rounded-lg ${
                              isBestDay ? 'bg-[#C45A3B]' : 'bg-[#8B9A7D]'
                            }`}
                            style={{ width: `${Math.max(rate, 2)}%` }}
                          />
                        )}
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-[#0F0F0F]/70">
                          {data.total > 0 ? `${Math.round(rate)}%` : "—"}
                          {data.total > 0 && (
                            <span className="text-[#0F0F0F]/30 ml-1">
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
                <div className="h-px w-12 bg-[#0F0F0F]/10" />
              </div>
              <HistorySheet
                edge={{ ...edge, logs: filteredLogs }}
                onDeleteLog={deleteLog}
                onUpdateLog={updateLog}
              />
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-[#0F0F0F]/10 text-center">
                <p className="text-[#0F0F0F]/40 text-sm">
                  No {isBacktest ? 'backtest' : 'live'} logs yet for this edge.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-white border border-[#0F0F0F]/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.result === "OCCURRED"
                          ? log.outcome === "WIN" ? "bg-[#8B9A7D]" : "bg-[#C45A3B]"
                          : "bg-[#0F0F0F]/20"
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-[#0F0F0F]">
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
                        <p className="text-xs text-[#0F0F0F]/40">
                          {log.dayOfWeek} • {log.date}
                        </p>
                      </div>
                    </div>
                    {log.result === "OCCURRED" && (
                      <span className="text-xs text-[#0F0F0F]/40">{log.durationMinutes}m</span>
                    )}
                  </div>
                ))}
                {filteredLogs.length > 10 && (
                  <p className="text-center text-xs text-[#0F0F0F]/40 pt-2">
                    +{filteredLogs.length - 10} more entries
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0F0F0F]/5 py-6 mt-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/30">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase"><img src="/logo-icon-transparent.png" alt="" className="w-5 h-5" />Edge of ICT</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>
    </>
  );
}
