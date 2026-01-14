"use client";

import { useMemo } from "react";
import { Target, Plus, ArrowRight, TrendingUp } from "lucide-react";
import type { EdgeWithLogs, TradeLogInput, LogType } from "@/lib/types";
import { LogDialog } from "@/components/log-dialog";
import { HistorySheet } from "@/components/history-sheet";
import Link from "next/link";

interface EdgeGridProps {
  edgesWithLogs: EdgeWithLogs[];
  onAddLog: (edgeId: string, data: TradeLogInput) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, data: TradeLogInput) => void;
  defaultLogType?: LogType;
}

interface EdgeCardData {
  edge: EdgeWithLogs;
  occurrenceRate: number;
  totalLogs: number;
  bestDay: string | null;
  winRate: number;
  wins: number;
  losses: number;
}

export function EdgeGrid({ edgesWithLogs, onAddLog, onDeleteLog, onUpdateLog, defaultLogType = "FRONTTEST" }: EdgeGridProps) {
  const edgeData = useMemo(() => {
    return edgesWithLogs.map((edge): EdgeCardData => {
      const occurredLogs = edge.logs.filter(l => l.result === "OCCURRED");
      const occurred = occurredLogs.length;
      const total = edge.logs.length;
      const occurrenceRate = total > 0 ? Math.round((occurred / total) * 100) : 0;

      const wins = occurredLogs.filter(l => l.outcome === "WIN").length;
      const losses = occurredLogs.filter(l => l.outcome === "LOSS").length;
      const winRate = occurred > 0 ? Math.round((wins / occurred) * 100) : 0;

      const dayOccurrences: Record<string, number> = {};
      occurredLogs.forEach(log => {
        dayOccurrences[log.dayOfWeek] = (dayOccurrences[log.dayOfWeek] || 0) + 1;
      });
      const bestDay = Object.keys(dayOccurrences).length > 0
        ? Object.keys(dayOccurrences).reduce((a, b) => dayOccurrences[a] > dayOccurrences[b] ? a : b)
        : null;

      return { edge, occurrenceRate, totalLogs: total, bestDay, winRate, wins, losses };
    });
  }, [edgesWithLogs]);

  if (edgesWithLogs.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-[#0F0F0F]/10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#0F0F0F]/5 flex items-center justify-center">
          <Target className="w-6 h-6 text-[#0F0F0F]/30" />
        </div>
        <h3
          className="text-xl mb-2"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          No edges yet
        </h3>
        <p className="text-sm text-[#0F0F0F]/40 mb-6 max-w-xs mx-auto">
          Create your first trading edge to start tracking occurrences.
        </p>
        <Link
          href="/settings/edges"
          className="inline-flex items-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300"
        >
          <Plus className="w-4 h-4" />
          Create Edge
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3
            className="text-lg tracking-tight"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Your Edges
          </h3>
          <div className="h-px w-12 bg-[#0F0F0F]/10" />
        </div>
        <Link
          href="/settings/edges"
          className="inline-flex items-center gap-1.5 text-xs text-[#0F0F0F]/40 hover:text-[#C45A3B] transition-colors duration-300 uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {edgeData.map(({ edge, occurrenceRate, totalLogs, bestDay, winRate, wins, losses }) => (
          <div
            key={edge.id}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-[#0F0F0F]/5 hover:border-[#0F0F0F]/10 transition-all duration-300 group"
          >
            <Link href={`/edge/${edge.id}`} className="block mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4
                    className="text-lg font-normal tracking-tight text-[#0F0F0F] group-hover:text-[#C45A3B] transition-colors"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {edge.name}
                  </h4>
                  {edge.description && (
                    <p className="text-xs text-[#0F0F0F]/40 mt-1 line-clamp-1">
                      {edge.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#0F0F0F]/30 uppercase tracking-wider">
                    {totalLogs} day{totalLogs !== 1 ? "s" : ""}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#0F0F0F]/20 group-hover:text-[#C45A3B] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Occurrence rate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#0F0F0F]/40 uppercase tracking-wider">Occurrence</span>
                  <span
                    className="font-medium text-[#0F0F0F]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {occurrenceRate}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#0F0F0F]/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8B9A7D] rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(occurrenceRate, 2)}%` }}
                  />
                </div>
              </div>

              {/* Win rate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#0F0F0F]/40 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Win Rate
                  </span>
                  <span
                    className="font-medium text-[#0F0F0F]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {winRate}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#0F0F0F]/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${winRate >= 50 ? 'bg-[#8B9A7D]' : 'bg-[#C45A3B]'}`}
                    style={{ width: `${Math.max(winRate, 2)}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#0F0F0F]/30 mt-1">
                  <span className="text-[#8B9A7D]">{wins}W</span> / <span className="text-[#C45A3B]">{losses}L</span>
                </p>
              </div>
            </div>

            {/* Best day */}
            {bestDay && (
              <p className="text-xs text-[#0F0F0F]/30 mb-4">
                Most active: <span className="text-[#0F0F0F]/50">{bestDay}</span>
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <LogDialog
                edgeName={edge.name}
                defaultLogType={defaultLogType}
                onSave={(data) => onAddLog(edge.id, data)}
                trigger={
                  <button className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
                    <Plus className="w-3.5 h-3.5" />
                    Log
                  </button>
                }
              />
              <HistorySheet
                edge={edge}
                onDeleteLog={onDeleteLog}
                onUpdateLog={onUpdateLog}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
