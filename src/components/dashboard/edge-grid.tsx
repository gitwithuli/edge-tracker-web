"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, ChevronRight } from "lucide-react";
import type { EdgeWithLogs, TradeLogInput } from "@/lib/types";
import { LogDialog } from "@/components/log-dialog";
import Link from "next/link";

interface EdgeGridProps {
  edgesWithLogs: EdgeWithLogs[];
  onAddLog: (edgeId: string, data: TradeLogInput) => void;
}

interface EdgeCardData {
  edge: EdgeWithLogs;
  winRate: number;
  totalTrades: number;
  bestDay: string | null;
}

export function EdgeGrid({ edgesWithLogs, onAddLog }: EdgeGridProps) {
  const edgeData = useMemo(() => {
    return edgesWithLogs.map((edge): EdgeCardData => {
      const wins = edge.logs.filter(l => l.result === "WIN").length;
      const total = edge.logs.length;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      // Find best day for this edge
      const dayWins: Record<string, number> = {};
      edge.logs.filter(l => l.result === "WIN").forEach(log => {
        dayWins[log.dayOfWeek] = (dayWins[log.dayOfWeek] || 0) + 1;
      });
      const bestDay = Object.keys(dayWins).length > 0
        ? Object.keys(dayWins).reduce((a, b) => dayWins[a] > dayWins[b] ? a : b)
        : null;

      return { edge, winRate, totalTrades: total, bestDay };
    });
  }, [edgesWithLogs]);

  if (edgesWithLogs.length === 0) {
    return (
      <Card className="bg-zinc-950 border-zinc-800 border-dashed">
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">No edges yet</h3>
          <p className="text-sm text-zinc-600 mb-4">
            Create your first trading edge to start tracking.
          </p>
          <Link href="/settings/edges">
            <Button className="bg-white text-black hover:bg-zinc-200">
              <Plus className="w-4 h-4 mr-2" />
              Create Edge
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4" />
          Your Edges
        </h3>
        <Link href="/settings/edges">
          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">
            <Plus className="w-4 h-4 mr-1" />
            New Edge
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {edgeData.map(({ edge, winRate, totalTrades, bestDay }) => (
          <Card key={edge.id} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">{edge.name}</h4>
                  {edge.description && (
                    <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">
                      {edge.description}
                    </p>
                  )}
                </div>
                <Link href={`/edge/${edge.id}`}>
                  <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white p-1 h-auto">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Win rate bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Win Rate</span>
                  <span className={`font-medium ${winRate >= 50 ? "text-green-500" : "text-red-500"}`}>
                    {winRate}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      winRate >= 60 ? "bg-green-500" : winRate >= 50 ? "bg-green-600" : "bg-red-500"
                    }`}
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between text-xs mb-4">
                <span className="text-zinc-500">
                  {totalTrades} trade{totalTrades !== 1 ? "s" : ""}
                </span>
                {bestDay && (
                  <span className="text-zinc-500">
                    Best: <span className="text-zinc-400">{bestDay.slice(0, 3)}</span>
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <LogDialog
                  edgeName={edge.name}
                  onSave={(data) => onAddLog(edge.id, data)}
                  trigger={
                    <Button size="sm" className="flex-1 bg-white text-black hover:bg-zinc-200 font-medium">
                      <Plus className="w-3 h-3 mr-1" />
                      Log
                    </Button>
                  }
                />
                <Link href={`/edge/${edge.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900">
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
