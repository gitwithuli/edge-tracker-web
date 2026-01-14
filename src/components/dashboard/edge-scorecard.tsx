"use client";

import { useMemo } from "react";
import { Target, TrendingUp, ArrowRight } from "lucide-react";
import type { EdgeWithLogs } from "@/lib/types";
import Link from "next/link";

interface EdgeScorecardProps {
  edgesWithLogs: EdgeWithLogs[];
}

interface EdgeScore {
  id: string;
  name: string;
  occurrenceRate: number;
  winRate: number;
  totalLogs: number;
  wins: number;
  losses: number;
}

export function EdgeScorecard({ edgesWithLogs }: EdgeScorecardProps) {
  const scores = useMemo((): EdgeScore[] => {
    return edgesWithLogs
      .map((edge) => {
        const totalLogs = edge.logs.length;
        const occurredLogs = edge.logs.filter((l) => l.result === "OCCURRED");
        const occurrences = occurredLogs.length;
        const occurrenceRate = totalLogs > 0 ? Math.round((occurrences / totalLogs) * 100) : 0;

        const wins = occurredLogs.filter((l) => l.outcome === "WIN").length;
        const losses = occurredLogs.filter((l) => l.outcome === "LOSS").length;
        const winRate = occurrences > 0 ? Math.round((wins / occurrences) * 100) : 0;

        return {
          id: edge.id,
          name: edge.name,
          occurrenceRate,
          winRate,
          totalLogs,
          wins,
          losses,
        };
      })
      .sort((a, b) => {
        // Sort by win rate first, then occurrence rate
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.occurrenceRate - a.occurrenceRate;
      });
  }, [edgesWithLogs]);

  if (edgesWithLogs.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#0F0F0F]/5">
        <div className="flex items-center gap-4 mb-6">
          <h3
            className="text-lg tracking-tight"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Edge Scorecard
          </h3>
          <div className="flex-1 h-px bg-[#0F0F0F]/10" />
        </div>
        <p className="text-[#0F0F0F]/40 text-sm py-8 text-center">
          No edges yet. Create your first edge to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#0F0F0F]/5">
      <div className="flex items-center gap-4 mb-6">
        <h3
          className="text-lg tracking-tight"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Edge Scorecard
        </h3>
        <div className="flex-1 h-px bg-[#0F0F0F]/10" />
      </div>

      <div className="space-y-3">
        {scores.map((score, index) => {
          const isTop = index === 0 && score.totalLogs >= 3;

          return (
            <Link
              key={score.id}
              href={`/edge/${score.id}`}
              className="block p-4 rounded-xl bg-[#FAF7F2] hover:bg-[#0F0F0F]/5 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isTop && (
                    <span className="text-[10px] font-medium text-[#C45A3B] bg-[#C45A3B]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Top
                    </span>
                  )}
                  <h4
                    className="text-sm font-medium text-[#0F0F0F] group-hover:text-[#C45A3B] transition-colors"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {score.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1 text-[#0F0F0F]/30">
                  <span className="text-xs">{score.totalLogs} days</span>
                  <ArrowRight className="w-3 h-3 group-hover:text-[#C45A3B] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Occurrence Rate */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target className="w-3 h-3 text-[#0F0F0F]/30" />
                    <span className="text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider">
                      Occurrence
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#0F0F0F]/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8B9A7D] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(score.occurrenceRate, 2)}%` }}
                      />
                    </div>
                    <span
                      className="text-sm font-medium text-[#0F0F0F] min-w-[36px] text-right"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {score.occurrenceRate}%
                    </span>
                  </div>
                </div>

                {/* Win Rate */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="w-3 h-3 text-[#0F0F0F]/30" />
                    <span className="text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider">
                      Win Rate
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#0F0F0F]/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score.winRate >= 50 ? "bg-[#8B9A7D]" : "bg-[#C45A3B]"
                        }`}
                        style={{ width: `${Math.max(score.winRate, 2)}%` }}
                      />
                    </div>
                    <span
                      className="text-sm font-medium text-[#0F0F0F] min-w-[36px] text-right"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {score.winRate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[#0F0F0F]/30 mt-1">
                    <span className="text-[#8B9A7D]">{score.wins}W</span>
                    {" / "}
                    <span className="text-[#C45A3B]">{score.losses}L</span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
