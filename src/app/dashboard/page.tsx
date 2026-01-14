"use client";

import { useEffect, useState, useMemo } from "react";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { LogOut, Plus, Settings, Play, Rewind, BarChart3, Download, Timer } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EdgeScorecard } from "@/components/dashboard/edge-scorecard";
import { EdgeGrid } from "@/components/dashboard/edge-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { BacktestStats } from "@/components/dashboard/backtest-stats";
import {
  DateRangeFilter,
  filterLogsByDateRange,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-filter";
import { LogDialog } from "@/components/log-dialog";
import Link from "next/link";
import type { LogType } from "@/lib/types";

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

export default function DashboardPage() {
  const { logs, isLoaded, logout, user, addLog, deleteLog, updateLog, getEdgesWithLogs } = useEdgeStore();
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<LogType>("FRONTTEST");
  const [liveDateRange, setLiveDateRange] = useState<DateRange>(getDefaultDateRange);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter by log type first
  const logsByType = useMemo(() => {
    return logs.filter(log => (log.logType || 'FRONTTEST') === activeView);
  }, [logs, activeView]);

  // Then filter by date range for live view
  const filteredLogs = useMemo(() => {
    if (activeView === 'BACKTEST') {
      return logsByType; // Backtest has its own internal date filter
    }
    return filterLogsByDateRange(logsByType, liveDateRange);
  }, [logsByType, activeView, liveDateRange]);

  const edgesWithLogs = getEdgesWithLogs();

  const edgesWithFilteredLogs = useMemo(() => {
    return edgesWithLogs.map(edge => {
      const logsByTypeForEdge = edge.logs.filter(log => (log.logType || 'FRONTTEST') === activeView);
      if (activeView === 'BACKTEST') {
        return { ...edge, logs: logsByTypeForEdge };
      }
      return { ...edge, logs: filterLogsByDateRange(logsByTypeForEdge, liveDateRange) };
    });
  }, [edgesWithLogs, activeView, liveDateRange]);

  const totalLogsForType = logsByType.length;

  if (!isLoaded || !user) {
    return null;
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
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4 flex justify-between items-center">
            <div
              className={`text-sm tracking-[0.2em] uppercase font-medium opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              EdgeTracker
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {edgesWithLogs.length > 0 && (
                <LogDialog
                  defaultLogType={activeView}
                  onSave={(data) => {
                    if (edgesWithLogs[0]) {
                      addLog(edgesWithLogs[0].id, data);
                    }
                  }}
                  trigger={
                    <button className="inline-flex items-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Log {isBacktest ? 'Backtest' : 'Day'}</span>
                    </button>
                  }
                />
              )}

              <Link
                href="/macros"
                className="p-2 rounded-full text-[#0F0F0F]/40 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300"
                title="Macro Tracker"
              >
                <Timer className="w-4 h-4" />
              </Link>

              <a
                href="/api/backup"
                download
                className="p-2 rounded-full text-[#0F0F0F]/40 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300"
                title="Download Backup"
              >
                <Download className="w-4 h-4" />
              </a>

              <Link
                href="/settings/edges"
                className="p-2 rounded-full text-[#0F0F0F]/40 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 p-2 rounded-full text-[#0F0F0F]/40 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          {/* Welcome section with View Toggle */}
          <div
            className={`mb-10 sm:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="text-[#C45A3B] text-xs tracking-[0.3em] uppercase font-medium mb-3">
                  Dashboard
                </p>
                <h1
                  className="text-3xl sm:text-4xl tracking-tight"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Track your <span className="italic text-[#0F0F0F]/60">edge</span>
                </h1>
              </div>

              {/* View Toggle */}
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
                  Live Trading
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
            </div>
          </div>

          {/* Stats Cards */}
          <section
            className={`mb-10 sm:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40">
                  {isBacktest ? 'Backtest Summary' : 'Live Summary'}
                </span>
                <div className="hidden sm:block flex-1 h-px bg-[#0F0F0F]/10 min-w-[40px]" />
              </div>
              {!isBacktest && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto">
                  <DateRangeFilter value={liveDateRange} onChange={setLiveDateRange} />
                  {filteredLogs.length !== totalLogsForType && (
                    <span className="text-xs text-[#0F0F0F]/40">
                      {filteredLogs.length} of {totalLogsForType}
                    </span>
                  )}
                </div>
              )}
            </div>
            <StatsCards logs={filteredLogs} edgesWithLogs={edgesWithFilteredLogs} />
          </section>

          {/* Backtest-specific Statistics */}
          {isBacktest && filteredLogs.length > 0 && (
            <section
              className={`mb-10 sm:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.25s' }}
            >
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-4 h-4 text-[#0F0F0F]/40" />
                <span className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40">
                  Backtest Analytics
                </span>
                <div className="flex-1 h-px bg-[#0F0F0F]/10" />
              </div>
              <BacktestStats logs={filteredLogs} edgesWithLogs={edgesWithFilteredLogs} />
            </section>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Chart + Edges */}
            <div className="lg:col-span-2 space-y-8">
              <div
                className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.3s' }}
              >
                <EdgeScorecard edgesWithLogs={edgesWithFilteredLogs} />
              </div>
              <div
                className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.4s' }}
              >
                <EdgeGrid
                  edgesWithLogs={edgesWithFilteredLogs}
                  onAddLog={addLog}
                  onDeleteLog={deleteLog}
                  onUpdateLog={updateLog}
                  defaultLogType={activeView}
                />
              </div>
            </div>

            {/* Right Column - Recent Activity */}
            <div
              className={`lg:col-span-1 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.5s' }}
            >
              <RecentActivity logs={filteredLogs} edgesWithLogs={edgesWithFilteredLogs} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0F0F0F]/5 py-6 mt-12">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/30">
            <span className="tracking-[0.15em] uppercase">EdgeTracker</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>
    </>
  );
}
