"use client";

import { useMemo, useState } from "react";
import { Target, TrendingUp, ArrowRight, DollarSign, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, GitBranch } from "lucide-react";
import type { EdgeWithLogs, TradeLog } from "@/lib/types";
import { getSymbolInfo } from "@/lib/constants";
import { formatCurrencyCompact } from "@/lib/utils";
import { countTradingDays } from "@/lib/edge-stats";
import Link from "next/link";

interface EdgeScorecardProps {
  edgesWithLogs: EdgeWithLogs[];
}

interface DirectionStats {
  count: number;
  wins: number;
  winRate: number;
  pnl: number;
  dollarPnl: number | null;
}

interface EdgeScore {
  id: string;
  name: string;
  occurrenceRate: number;
  winRate: number;
  tradingDays: number;
  occurrences: number;
  wins: number;
  losses: number;
  pnl: number | null;
  dollarPnl: number | null;
  hasPriceTracking: boolean;
  longStats: DirectionStats | null;
  shortStats: DirectionStats | null;
  parentEdgeId?: string | null;
}

interface EdgeGroup {
  parent: EdgeScore;
  subEdges: EdgeScore[];
}

function calculateEdgeScore(edge: EdgeWithLogs, logs?: TradeLog[], createdAt?: string): EdgeScore {
  const edgeLogs = logs || edge.logs;
  const occurredLogs = edgeLogs.filter((l) => l.result === "OCCURRED");
  const occurrences = occurredLogs.length;

  // Use trading days since edge creation for occurrence rate
  const edgeCreatedAt = createdAt || edge.createdAt;
  const tradingDays = edgeCreatedAt ? countTradingDays(edgeCreatedAt) : 0;
  const occurrenceRate = tradingDays > 0 ? Math.round((occurrences / tradingDays) * 100) : 0;

  const wins = occurredLogs.filter((l) => l.outcome === "WIN").length;
  const losses = occurredLogs.filter((l) => l.outcome === "LOSS").length;
  const winRate = occurrences > 0 ? Math.round((wins / occurrences) * 100) : 0;

  const hasPriceTracking = edge.enabledFields?.includes('entryExitPrices') ?? false;

  let pnl: number | null = null;
  let dollarPnl: number | null = null;
  let longStats: DirectionStats | null = null;
  let shortStats: DirectionStats | null = null;

  if (hasPriceTracking) {
    const logsWithPrices = occurredLogs.filter(
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

  return {
    id: edge.id,
    name: edge.name,
    occurrenceRate,
    winRate,
    tradingDays,
    occurrences,
    wins,
    losses,
    pnl,
    dollarPnl,
    hasPriceTracking,
    longStats,
    shortStats,
    parentEdgeId: edge.parentEdgeId,
  };
}

export function EdgeScorecard({ edgesWithLogs }: EdgeScorecardProps) {
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

  // Organize edges into groups and standalone
  const { edgeGroups, standaloneScores } = useMemo(() => {
    const groups: EdgeGroup[] = [];
    const standalone: EdgeScore[] = [];
    const subEdgeIds = new Set<string>();

    // First pass: identify all sub-edges
    edgesWithLogs.forEach(edge => {
      if (edge.parentEdgeId) {
        subEdgeIds.add(edge.id);
      }
    });

    // Second pass: create groups and standalone
    edgesWithLogs.forEach(edge => {
      if (edge.parentEdgeId) return; // Skip sub-edges

      const subEdges = edgesWithLogs.filter(e => e.parentEdgeId === edge.id);

      if (subEdges.length > 0) {
        // Parent edge with sub-edges - calculate combined stats
        // Use parent's createdAt for the combined occurrence rate
        const allLogs = [...edge.logs, ...subEdges.flatMap(s => s.logs)];
        const parentScore = calculateEdgeScore(edge, allLogs, edge.createdAt);
        const subEdgeScores = subEdges.map(s => calculateEdgeScore(s));
        groups.push({ parent: parentScore, subEdges: subEdgeScores });
      } else if (!subEdgeIds.has(edge.id)) {
        // Standalone edge
        standalone.push(calculateEdgeScore(edge));
      }
    });

    // Sort standalone by win rate then occurrence rate
    standalone.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.occurrenceRate - a.occurrenceRate;
    });

    // Sort groups by combined win rate
    groups.sort((a, b) => {
      if (b.parent.winRate !== a.parent.winRate) return b.parent.winRate - a.parent.winRate;
      return b.parent.occurrenceRate - a.parent.occurrenceRate;
    });

    return { edgeGroups: groups, standaloneScores: standalone };
  }, [edgesWithLogs]);

  if (edgesWithLogs.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10">
        <div className="flex items-center gap-4 mb-6">
          <h3
            className="text-lg tracking-tight dark:text-white"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Edge Scorecard
          </h3>
          <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />
        </div>
        <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm py-8 text-center">
          No edges yet. Create your first edge to start tracking.
        </p>
      </div>
    );
  }

  // Render a single score card
  const renderScoreCard = (score: EdgeScore, isTop = false) => (
    <Link
      key={score.id}
      href={`/edge/${score.id}`}
      className="block p-4 rounded-xl bg-[#FAF7F2] dark:bg-white/[0.02] hover:bg-[#0F0F0F]/5 dark:hover:bg-white/[0.05] transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isTop && (
            <span className="text-[10px] font-medium text-[#C45A3B] bg-[#C45A3B]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Top
            </span>
          )}
          <h4
            className="text-sm font-medium text-[#0F0F0F] dark:text-white group-hover:text-[#C45A3B] transition-colors"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {score.name}
          </h4>
        </div>
        <div className="flex items-center gap-1 text-[#0F0F0F]/30 dark:text-white/30">
          <span className="text-xs">{score.occurrences} in {score.tradingDays}d</span>
          <ArrowRight className="w-3 h-3 group-hover:text-[#C45A3B] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Occurrence Rate */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
            <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider">
              Occurrence
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#0F0F0F]/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B9A7D] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(score.occurrenceRate, 2)}%` }}
              />
            </div>
            <span
              className="text-sm font-medium text-[#0F0F0F] dark:text-white min-w-[36px] text-right"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {score.occurrenceRate}%
            </span>
          </div>
        </div>

        {/* Win Rate */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
            <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider">
              Win Rate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#0F0F0F]/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  score.winRate >= 50 ? "bg-[#8B9A7D]" : "bg-[#C45A3B]"
                }`}
                style={{ width: `${Math.max(score.winRate, 2)}%` }}
              />
            </div>
            <span
              className="text-sm font-medium text-[#0F0F0F] dark:text-white min-w-[36px] text-right"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {score.winRate}%
            </span>
          </div>
          <p className="text-[10px] text-[#0F0F0F]/30 dark:text-white/30 mt-1">
            <span className="text-[#8B9A7D]">{score.wins}W</span>
            {" / "}
            <span className="text-[#C45A3B]">{score.losses}L</span>
          </p>
        </div>

        {/* P&L + Long/Short Breakdown - only shown when price tracking is enabled */}
        {score.hasPriceTracking && score.pnl !== null && (
          <div className="col-span-2 pt-2 border-t border-[#0F0F0F]/5 dark:border-white/10 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
                <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider">
                  Total P&L
                </span>
              </div>
              <div className="text-right">
                {score.dollarPnl !== null ? (
                  <span
                    className={`text-sm font-medium ${
                      score.dollarPnl >= 0 ? "text-[#8B9A7D]" : "text-[#C45A3B]"
                    }`}
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {formatCurrencyCompact(score.dollarPnl)}
                  </span>
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      score.pnl >= 0 ? "text-[#8B9A7D]" : "text-[#C45A3B]"
                    }`}
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {score.pnl >= 0 ? "+" : ""}{score.pnl.toFixed(2)} pts
                  </span>
                )}
              </div>
            </div>

            {/* Long/Short Breakdown */}
            {(score.longStats || score.shortStats) && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Long Stats */}
                {score.longStats && (
                  <div className="bg-[#8B9A7D]/5 dark:bg-[#8B9A7D]/10 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowUpRight className="w-3 h-3 text-[#8B9A7D]" />
                      <span className="text-[9px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider">Long</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40">
                        {score.longStats.wins}W/{score.longStats.count - score.longStats.wins}L ({score.longStats.winRate}%)
                      </span>
                      <span className={`text-xs font-medium ${score.longStats.pnl >= 0 ? "text-[#8B9A7D]" : "text-[#C45A3B]"}`}>
                        {score.longStats.dollarPnl !== null
                          ? formatCurrencyCompact(score.longStats.dollarPnl)
                          : `${score.longStats.pnl >= 0 ? "+" : ""}${score.longStats.pnl.toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Short Stats */}
                {score.shortStats && (
                  <div className="bg-[#C45A3B]/5 dark:bg-[#C45A3B]/10 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowDownRight className="w-3 h-3 text-[#C45A3B]" />
                      <span className="text-[9px] text-[#0F0F0F]/50 dark:text-white/50 uppercase tracking-wider">Short</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40">
                        {score.shortStats.wins}W/{score.shortStats.count - score.shortStats.wins}L ({score.shortStats.winRate}%)
                      </span>
                      <span className={`text-xs font-medium ${score.shortStats.pnl >= 0 ? "text-[#8B9A7D]" : "text-[#C45A3B]"}`}>
                        {score.shortStats.dollarPnl !== null
                          ? formatCurrencyCompact(score.shortStats.dollarPnl)
                          : `${score.shortStats.pnl >= 0 ? "+" : ""}${score.shortStats.pnl.toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10">
      <div className="flex items-center gap-4 mb-6">
        <h3
          className="text-lg tracking-tight dark:text-white"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Edge Scorecard
        </h3>
        <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />
      </div>

      <div className="space-y-3">
        {/* Edge Groups (Parent + collapsible sub-edges) */}
        {edgeGroups.map(({ parent, subEdges }) => {
          const isExpanded = expandedGroups.has(parent.id);
          return (
            <div key={parent.id}>
              {/* Parent card - clickable to expand */}
              <div
                onClick={() => toggleGroup(parent.id)}
                className="block p-4 rounded-xl bg-[#FAF7F2] dark:bg-white/[0.02] hover:bg-[#0F0F0F]/5 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
                    )}
                    <GitBranch className="w-3.5 h-3.5 text-[#C45A3B]" />
                    <h4
                      className="text-sm font-medium text-[#0F0F0F] dark:text-white group-hover:text-[#C45A3B] transition-colors"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {parent.name}
                    </h4>
                    <span className="text-[10px] text-[#0F0F0F]/30 dark:text-white/30">
                      {subEdges.length} sub-edge{subEdges.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#0F0F0F]/30 dark:text-white/30">
                    <span className="text-xs">{parent.occurrences} in {parent.tradingDays}d</span>
                    <ArrowRight className="w-3 h-3 group-hover:text-[#C45A3B] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Occurrence Rate */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Target className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
                      <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider">
                        Occurrence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#0F0F0F]/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8B9A7D] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(parent.occurrenceRate, 2)}%` }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium text-[#0F0F0F] dark:text-white min-w-[36px] text-right"
                        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                      >
                        {parent.occurrenceRate}%
                      </span>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
                      <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider">
                        Win Rate
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#0F0F0F]/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            parent.winRate >= 50 ? "bg-[#8B9A7D]" : "bg-[#C45A3B]"
                          }`}
                          style={{ width: `${Math.max(parent.winRate, 2)}%` }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium text-[#0F0F0F] dark:text-white min-w-[36px] text-right"
                        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                      >
                        {parent.winRate}%
                      </span>
                    </div>
                    <p className="text-[10px] text-[#0F0F0F]/30 dark:text-white/30 mt-1">
                      <span className="text-[#8B9A7D]">{parent.wins}W</span>
                      {" / "}
                      <span className="text-[#C45A3B]">{parent.losses}L</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-edges (collapsible with slide animation) */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pl-6 pt-2 space-y-2 border-l-2 border-[#C45A3B]/20 ml-4 mt-2">
                  {subEdges.map(subEdge => renderScoreCard(subEdge))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Standalone edges */}
        {standaloneScores.map((score, index) =>
          renderScoreCard(score, index === 0 && edgeGroups.length === 0 && score.tradingDays >= 3)
        )}
      </div>
    </div>
  );
}
