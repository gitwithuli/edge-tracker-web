"use client";

import { useEffect, useState } from "react";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { LogOut, Plus, Settings, ArrowRight } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DayChart } from "@/components/dashboard/day-chart";
import { EdgeGrid } from "@/components/dashboard/edge-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { LogDialog } from "@/components/log-dialog";
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

export default function DashboardPage() {
  const { logs, isLoaded, logout, user, addLog, deleteLog, updateLog, getEdgesWithLogs } = useEdgeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded || !user) {
    return null;
  }

  const edgesWithLogs = getEdgesWithLogs();

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
                  onSave={(data) => {
                    if (edgesWithLogs[0]) {
                      addLog(edgesWithLogs[0].id, data);
                    }
                  }}
                  trigger={
                    <button className="inline-flex items-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Log Day</span>
                    </button>
                  }
                />
              )}

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
          {/* Welcome section */}
          <div
            className={`mb-10 sm:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
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

          {/* Stats Cards */}
          <section
            className={`mb-10 sm:mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40">This Week</span>
              <div className="flex-1 h-px bg-[#0F0F0F]/10" />
            </div>
            <StatsCards logs={logs} edgesWithLogs={edgesWithLogs} />
          </section>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Chart + Edges */}
            <div className="lg:col-span-2 space-y-8">
              <div
                className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.3s' }}
              >
                <DayChart logs={logs} />
              </div>
              <div
                className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.4s' }}
              >
                <EdgeGrid edgesWithLogs={edgesWithLogs} onAddLog={addLog} onDeleteLog={deleteLog} onUpdateLog={updateLog} />
              </div>
            </div>

            {/* Right Column - Recent Activity */}
            <div
              className={`lg:col-span-1 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.5s' }}
            >
              <RecentActivity logs={logs} edgesWithLogs={edgesWithLogs} />
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
