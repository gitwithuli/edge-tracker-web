"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { LogOut, Plus, Settings, Play, Rewind, BarChart3, Download, Timer, Loader2 } from "lucide-react";
import { EconomicCalendarSidebar } from "@/components/dashboard/economic-calendar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EdgeScorecard } from "@/components/dashboard/edge-scorecard";
import { EdgeGrid } from "@/components/dashboard/edge-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { BacktestStats } from "@/components/dashboard/backtest-stats";
import { GrainOverlay } from "@/components/grain-overlay";
import {
  DateRangeFilter,
  filterLogsByDateRange,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-filter";
import { LogDialog } from "@/components/log-dialog";
import Link from "next/link";
import type { LogType } from "@/lib/types";

function UpgradeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, fetchSubscription } = useEdgeStore();

  useEffect(() => {
    const upgraded = searchParams.get("upgraded") === "true";
    if (upgraded && user) {
      fetchSubscription().then(() => {
        toast.success("Welcome to Edge Tracker!");
        router.replace("/dashboard");
      });
    }
  }, [searchParams, user, fetchSubscription, router]);

  return null;
}

export default function DashboardPage() {
  const { logs, isLoaded, logout, user, addLog, deleteLog, updateLog, getEdgesWithLogs } = useEdgeStore();
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<LogType>("FRONTTEST");
  const [liveDateRange, setLiveDateRange] = useState<DateRange>(getDefaultDateRange);
  const router = useRouter();

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

  // Don't render dashboard content if not logged in (redirect is in progress)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/40 dark:text-white/40" />
      </div>
    );
  }

  const isBacktest = activeView === "BACKTEST";

  return (
    <>
      <Suspense fallback={null}>
        <UpgradeHandler />
      </Suspense>
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
        <header className="border-b border-[#0F0F0F]/5 dark:border-white/5 bg-[#FAF7F2]/80 dark:bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 sm:gap-2 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              <img src="/logo-icon-transparent.png" alt="Edge of ICT" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16" />
              <span
                className="hidden sm:inline text-xs md:text-sm tracking-[0.08em] font-medium"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                EDGE <span className="text-[#0F0F0F]/40 dark:text-white/40 text-[10px] md:text-xs">OF</span> ICT
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              {edgesWithLogs.length > 0 && (
                <LogDialog
                  defaultLogType={activeView}
                  onSave={(data, newEdgeId) => {
                    const targetEdgeId = newEdgeId || edgesWithLogs[0]?.id;
                    if (targetEdgeId) {
                      addLog(targetEdgeId, data);
                    }
                  }}
                  trigger={
                    <button className="inline-flex items-center gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Log {isBacktest ? 'Backtest' : 'Day'}</span>
                    </button>
                  }
                />
              )}

              <Link
                href="/macros"
                className="p-2 rounded-full text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 transition-all duration-300"
                title="Macro Tracker"
                aria-label="Macro Tracker"
              >
                <Timer className="w-4 h-4" aria-hidden="true" />
              </Link>

              <EconomicCalendarSidebar />

              <a
                href="/api/backup"
                download
                className="p-2 rounded-full text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 transition-all duration-300"
                title="Download Backup"
                aria-label="Download Backup"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </a>

              <ThemeToggle />

              <Link
                href="/settings/edges"
                className="p-2 rounded-full text-[#0F0F0F]/40 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10"
                aria-label="Edge Settings"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
              </Link>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 p-2 rounded-full text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 transition-all duration-300"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Welcome section with View Toggle */}
          <div
            className={`mb-8 sm:mb-10 lg:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              <div>
                <p className="text-[#C45A3B] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-2 sm:mb-3">
                  Dashboard
                </p>
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl tracking-tight"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Track your <span className="italic text-[#0F0F0F]/60 dark:text-white/60">edge</span>
                </h1>
              </div>

              {/* View Toggle */}
              <div className="flex p-0.5 sm:p-1 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-full">
                <button
                  onClick={() => setActiveView("FRONTTEST")}
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-medium transition-all duration-300 ${
                    activeView === "FRONTTEST"
                      ? "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] shadow-sm"
                      : "text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white"
                  }`}
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Forwardtest</span>
                  <span className="sm:hidden">Forward</span>
                </button>
                <button
                  onClick={() => setActiveView("BACKTEST")}
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-medium transition-all duration-300 ${
                    activeView === "BACKTEST"
                      ? "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] shadow-sm"
                      : "text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white"
                  }`}
                >
                  <Rewind className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Backtest</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <section
            className={`mb-8 sm:mb-10 lg:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 dark:text-white/40">
                  {isBacktest ? 'Backtest Summary' : 'Forwardtest Summary'}
                </span>
                <div className="hidden sm:block flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10 min-w-[40px]" />
              </div>
              {!isBacktest && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto">
                  <DateRangeFilter value={liveDateRange} onChange={setLiveDateRange} />
                  {filteredLogs.length !== totalLogsForType && (
                    <span className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
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
              className={`mb-8 sm:mb-10 lg:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.25s' }}
            >
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
                <span className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 dark:text-white/40">
                  Backtest Analytics
                </span>
                <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />
              </div>
              <BacktestStats logs={filteredLogs} edgesWithLogs={edgesWithFilteredLogs} />
            </section>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Chart + Edges */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
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
        <footer className="border-t border-[#0F0F0F]/5 dark:border-white/5 py-4 sm:py-6 mt-8 sm:mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/30 dark:text-white/30">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase"><img src="/logo-icon-transparent.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />Edge of ICT</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>
    </>
  );
}
