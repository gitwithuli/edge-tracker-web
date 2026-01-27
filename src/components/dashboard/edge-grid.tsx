"use client";

import { useMemo, useState } from "react";
import { Target, Plus, ArrowRight, TrendingUp, ChevronDown, ChevronRight, GitBranch } from "lucide-react";
import type { EdgeWithLogs, TradeLogInput, LogType, TradeLog } from "@/lib/types";
import { LogDialog } from "@/components/log-dialog";
import { HistorySheet } from "@/components/history-sheet";
import Link from "next/link";

interface EdgeGridProps {
  edgesWithLogs: EdgeWithLogs[];
  onAddLog: (edgeId: string, data: TradeLogInput) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, data: TradeLogInput, newEdgeId?: string) => void;
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

interface EdgeGroup {
  parent: EdgeCardData;
  subEdges: EdgeCardData[];
  combinedStats: {
    totalLogs: number;
    occurrenceRate: number;
    winRate: number;
    wins: number;
    losses: number;
  };
}

function calculateEdgeStats(edge: EdgeWithLogs): EdgeCardData {
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
}

function calculateCombinedStats(logs: TradeLog[]) {
  const occurredLogs = logs.filter(l => l.result === "OCCURRED");
  const occurred = occurredLogs.length;
  const total = logs.length;
  const occurrenceRate = total > 0 ? Math.round((occurred / total) * 100) : 0;

  const wins = occurredLogs.filter(l => l.outcome === "WIN").length;
  const losses = occurredLogs.filter(l => l.outcome === "LOSS").length;
  const winRate = occurred > 0 ? Math.round((wins / occurred) * 100) : 0;

  return { totalLogs: total, occurrenceRate, winRate, wins, losses };
}

export function EdgeGrid({ edgesWithLogs, onAddLog, onDeleteLog, onUpdateLog, defaultLogType = "FRONTTEST" }: EdgeGridProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (parentId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  // Organize edges into groups (parent + sub-edges) and standalone edges
  const { edgeGroups, standaloneEdges } = useMemo(() => {
    const groups: EdgeGroup[] = [];
    const standalone: EdgeCardData[] = [];
    const subEdgeIds = new Set<string>();

    // First pass: identify all sub-edges
    edgesWithLogs.forEach(edge => {
      if (edge.parentEdgeId) {
        subEdgeIds.add(edge.id);
      }
    });

    // Second pass: create groups for parent edges and collect standalone edges
    edgesWithLogs.forEach(edge => {
      // Skip sub-edges in this pass
      if (edge.parentEdgeId) return;

      const edgeStats = calculateEdgeStats(edge);
      const subEdges = edgesWithLogs
        .filter(e => e.parentEdgeId === edge.id)
        .map(calculateEdgeStats);

      if (subEdges.length > 0) {
        // This is a parent edge with sub-edges
        const allLogs = [...edge.logs, ...subEdges.flatMap(s => s.edge.logs)];
        groups.push({
          parent: edgeStats,
          subEdges,
          combinedStats: calculateCombinedStats(allLogs),
        });
      } else if (!subEdgeIds.has(edge.id)) {
        // This is a standalone edge (no parent, no children)
        standalone.push(edgeStats);
      }
    });

    return { edgeGroups: groups, standaloneEdges: standalone };
  }, [edgesWithLogs]);

  if (edgesWithLogs.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-[#0F0F0F]/10 dark:border-white/10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#0F0F0F]/5 dark:bg-white/5 flex items-center justify-center">
          <Target className="w-6 h-6 text-[#0F0F0F]/45 dark:text-white/45" />
        </div>
        <h3
          className="text-xl mb-2 dark:text-white"
          style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
        >
          No edges yet
        </h3>
        <p className="text-sm text-[#0F0F0F]/50 dark:text-white/50 mb-6 max-w-xs mx-auto">
          Create your first trading edge to start tracking occurrences.
        </p>
        <Link
          href="/settings/edges"
          className="inline-flex items-center gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300"
        >
          <Plus className="w-4 h-4" />
          Create Edge
        </Link>
      </div>
    );
  }

  // Render a single edge card
  const renderEdgeCard = ({ edge, occurrenceRate, totalLogs, bestDay, winRate, wins, losses }: EdgeCardData) => (
    <div
      key={edge.id}
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 hover:border-[#0F0F0F]/10 dark:hover:border-white/20 transition-colors duration-300 group"
    >
      <Link href={`/edge/${edge.id}`} className="block mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h4
              className="text-lg font-normal tracking-tight text-[#0F0F0F] dark:text-white group-hover:text-[#C45A3B] transition-colors"
              style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
            >
              {edge.name}
            </h4>
            {edge.description && (
              <p className="text-xs text-[#0F0F0F]/50 dark:text-white/50 mt-1 line-clamp-1">
                {edge.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#0F0F0F]/45 dark:text-white/45 uppercase tracking-wider">
              {totalLogs} day{totalLogs !== 1 ? "s" : ""}
            </span>
            <ArrowRight className="w-4 h-4 text-[#0F0F0F]/50 dark:text-white/50 group-hover:text-[#C45A3B] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Occurrence rate */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider">Occurrence</span>
            <span
              className="font-medium text-[#0F0F0F] dark:text-white"
              style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
            >
              {occurrenceRate}%
            </span>
          </div>
          <div className="h-1.5 bg-[#0F0F0F]/5 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B9A7D] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(occurrenceRate, 2)}%` }}
            />
          </div>
        </div>

        {/* Win rate */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Win Rate
            </span>
            <span
              className="font-medium text-[#0F0F0F] dark:text-white"
              style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
            >
              {winRate}%
            </span>
          </div>
          <div className="h-1.5 bg-[#0F0F0F]/5 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${winRate >= 50 ? 'bg-[#8B9A7D]' : 'bg-[#C45A3B]'}`}
              style={{ width: `${Math.max(winRate, 2)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#0F0F0F]/45 dark:text-white/45 mt-1">
            <span className="text-[#8B9A7D]">{wins}W</span> / <span className="text-[#C45A3B]">{losses}L</span>
          </p>
        </div>
      </div>

      {/* Best day */}
      {bestDay && (
        <p className="text-xs text-[#0F0F0F]/45 dark:text-white/45 mb-4">
          Most active: <span className="text-[#0F0F0F]/50 dark:text-white/50">{bestDay}</span>
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <LogDialog
          edgeName={edge.name}
          edgeId={edge.id}
          defaultLogType={defaultLogType}
          onSave={(data) => onAddLog(edge.id, data)}
          trigger={
            <button className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300">
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
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3
            className="text-lg tracking-tight dark:text-white"
            style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
          >
            Your Edges
          </h3>
          <div className="h-px w-12 bg-[#0F0F0F]/10 dark:bg-white/10" />
        </div>
        <Link
          href="/settings/edges"
          className="inline-flex items-center gap-1.5 text-xs text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#C45A3B] transition-colors duration-300 uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </Link>
      </div>

      <div className="space-y-4">
        {/* Edge Groups (parent + sub-edges) */}
        {edgeGroups.map(({ parent, subEdges, combinedStats }) => {
          const isExpanded = expandedGroups.has(parent.edge.id);
          return (
            <div key={parent.edge.id} className="space-y-3">
              {/* Group Header with Combined Stats */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0F0F0F]/[0.02] dark:from-white/[0.02] to-transparent border border-[#0F0F0F]/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => toggleGroup(parent.edge.id)}
                    className="flex items-center gap-2 hover:text-[#C45A3B] transition-colors dark:text-white"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <GitBranch className="w-4 h-4 text-[#C45A3B]" />
                    <h4
                      className="text-lg font-normal tracking-tight"
                      style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                    >
                      {parent.edge.name}
                    </h4>
                    <span className="text-xs text-[#0F0F0F]/50 dark:text-white/50 ml-2">
                      {subEdges.length} sub-edge{subEdges.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  <Link
                    href={`/edge/${parent.edge.id}`}
                    className="text-xs text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#C45A3B] transition-colors flex items-center gap-1"
                  >
                    View Group
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Combined Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider mb-1">Combined Days</p>
                    <p
                      className="text-xl font-medium dark:text-white"
                      style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                    >
                      {combinedStats.totalLogs}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider mb-1">Occurrence</p>
                    <p
                      className="text-xl font-medium dark:text-white"
                      style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                    >
                      {combinedStats.occurrenceRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider mb-1">Win Rate</p>
                    <p
                      className={`text-xl font-medium ${combinedStats.winRate >= 50 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`}
                      style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                    >
                      {combinedStats.winRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider mb-1">W/L</p>
                    <p className="text-sm">
                      <span className="text-[#8B9A7D]">{combinedStats.wins}W</span>
                      {' / '}
                      <span className="text-[#C45A3B]">{combinedStats.losses}L</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-edges (collapsible) */}
              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subEdges.map(subEdge => renderEdgeCard(subEdge))}
                </div>
              )}
            </div>
          );
        })}

        {/* Standalone Edges (no parent, no children) */}
        {standaloneEdges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standaloneEdges.map(edgeData => renderEdgeCard(edgeData))}
          </div>
        )}
      </div>
    </div>
  );
}
