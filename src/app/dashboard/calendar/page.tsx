"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { LogOut, Plus, Settings, Play, Rewind, ArrowLeft, Loader2, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { GrainOverlay } from "@/components/grain-overlay";
import { CalendarPnL } from "@/components/calendar-pnl";
import { LogDialog } from "@/components/log-dialog";
import { TrialBanner } from "@/components/trial-banner";
import Image from "next/image";
import Link from "next/link";
import type { LogType } from "@/lib/types";

export default function CalendarPage() {
  const { logs, edges, isLoaded, logout, user, addLog, deleteLog, updateLog, getEdgesWithLogs, canAccess, subscription } = useEdgeStore();
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<LogType>("FRONTTEST");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Free tier defaults to backtest view
  useEffect(() => {
    if (subscription && !canAccess('forwardtest')) {
      setActiveView("BACKTEST");
    }
  }, [subscription, canAccess]);

  // Filter logs by log type
  const filteredLogs = useMemo(() => {
    return logs.filter(log => (log.logType || 'FRONTTEST') === activeView);
  }, [logs, activeView]);

  const edgesWithLogs = useMemo(() => getEdgesWithLogs(), [edges, logs]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/login');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/50 dark:text-white/50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/50 dark:text-white/50" />
      </div>
    );
  }

  const isBacktest = activeView === "BACKTEST";

  return (
    <>
      <GrainOverlay />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white selection:bg-[#C45A3B]/20 transition-colors duration-300">
        {/* Header */}
        <header className="border-b border-[#0F0F0F]/5 dark:border-white/5 bg-[#FAF7F2]/80 dark:bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 sm:gap-2 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              <Image src="/logo-icon-transparent.png" alt="Edge of ICT" width={64} height={64} className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16" />
              <span
                className="hidden sm:inline text-xs md:text-sm tracking-[0.08em] font-medium"
                style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
              >
                EDGE <span className="text-[#0F0F0F]/50 dark:text-white/50 text-[10px] md:text-xs">OF</span> ICT
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

              <ThemeToggle />

              <Link
                href="/settings/edges"
                className="p-2 rounded-full text-[#0F0F0F]/50 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-colors duration-300 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10"
                aria-label="Edge Settings"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
              </Link>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 p-2 rounded-full text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 transition-colors duration-300"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <TrialBanner />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Page header with back button */}
          <div
            className={`mb-8 sm:mb-10 lg:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white text-sm mb-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl tracking-tight"
                  style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                >
                  Calendar <span className="italic text-[#0F0F0F]/60 dark:text-white/60">P&L</span>
                </h1>
              </div>

              {/* View Toggle */}
              <div className="flex p-0.5 sm:p-1 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-full">
                {canAccess('forwardtest') ? (
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
                ) : (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-medium text-[#0F0F0F]/45 dark:text-white/45 hover:text-[#C45A3B] dark:hover:text-[#C45A3B] transition-colors duration-300"
                  >
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Forwardtest</span>
                    <span className="sm:hidden">Forward</span>
                  </Link>
                )}
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

          {/* Full Calendar */}
          <div
            className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <CalendarPnL
              logs={filteredLogs}
              edges={edges}
              variant="full"
              showWeeklySummary={true}
              defaultLogType={activeView}
              onAddLog={addLog}
              onDeleteLog={deleteLog}
              onUpdateLog={updateLog}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0F0F0F]/5 dark:border-white/5 py-4 sm:py-6 mt-8 sm:mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/45 dark:text-white/45">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase"><Image src="/logo-icon-transparent.png" alt="" width={20} height={20} className="w-4 h-4 sm:w-5 sm:h-5" />Edge of ICT</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>
    </>
  );
}
