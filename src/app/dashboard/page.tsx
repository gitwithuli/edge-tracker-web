"use client";

import { useEdgeStore } from "@/hooks/use-edge-store";
import { Button } from "@/components/ui/button";
import { LogOut, TrendingUp, Plus, Settings } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DayChart } from "@/components/dashboard/day-chart";
import { EdgeGrid } from "@/components/dashboard/edge-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { LogDialog } from "@/components/log-dialog";
import Link from "next/link";

export default function DashboardPage() {
  const { logs, isLoaded, logout, user, addLog, getEdgesWithLogs } = useEdgeStore();

  if (!isLoaded || !user) {
    return null;
  }

  const edgesWithLogs = getEdgesWithLogs();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tighter text-white">EdgeTracker</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {edgesWithLogs.length > 0 && (
              <LogDialog
                onSave={(data) => {
                  if (edgesWithLogs[0]) {
                    addLog(edgesWithLogs[0].id, data);
                  }
                }}
                trigger={
                  <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-semibold">
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Log Trade</span>
                  </Button>
                }
              />
            )}

            <Link href="/settings/edges">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={logout} className="text-zinc-400 hover:text-white">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Welcome section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-zinc-500 text-sm sm:text-base">
            Track your ICT edges and find your winning patterns.
          </p>
        </div>

        {/* Stats Cards */}
        <section className="mb-6 sm:mb-8">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">THIS WEEK</p>
          <StatsCards logs={logs} edgesWithLogs={edgesWithLogs} />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Chart + Activity */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <DayChart logs={logs} />
            <EdgeGrid edgesWithLogs={edgesWithLogs} onAddLog={addLog} />
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-1">
            <RecentActivity logs={logs} edgesWithLogs={edgesWithLogs} />
          </div>
        </div>
      </main>
    </div>
  );
}
