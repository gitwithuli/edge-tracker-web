"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, CalendarCheck, Plus } from "lucide-react";
import type { Edge, TradeLogInput } from "@/lib/types";
import { WIN_RATE_THRESHOLD } from "@/lib/constants";
import { LogDialog } from "./log-dialog";
import { HistorySheet } from "./history-sheet";

interface EdgeCardProps {
  edge: Edge;
  onAddLog: (data: TradeLogInput) => void;
  onDeleteLog?: (id: string | number) => void;
  onUpdateLog?: (id: string, data: TradeLogInput) => void;
}

export const EdgeCard = memo(function EdgeCard({ edge, onAddLog, onDeleteLog, onUpdateLog }: EdgeCardProps) {
  const stats = useMemo(() => {
    const totalTrades = edge.logs.length;
    const wins = edge.logs.filter((l) => l.result === "WIN").length;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

    const totalDuration = edge.logs.reduce((acc, log) => acc + log.durationMinutes, 0);
    const avgDuration = totalTrades > 0 ? Math.round(totalDuration / totalTrades) : 0;

    const dayCounts: Record<string, number> = {};
    edge.logs.filter(l => l.result === "WIN").forEach(l => {
      dayCounts[l.dayOfWeek] = (dayCounts[l.dayOfWeek] || 0) + 1;
    });

    const bestDay = Object.keys(dayCounts).length > 0
      ? Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b)
      : "N/A";

    return { totalTrades, wins, winRate, avgDuration, bestDay };
  }, [edge.logs]);

  const recentLogs = useMemo(() => edge.logs.slice(0, 2), [edge.logs]);

  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 flex flex-col h-full shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="max-w-[70%]">
            <CardTitle className="text-xl font-bold tracking-tight">{edge.name}</CardTitle>
            <p className="text-xs text-zinc-500 mt-1 h-10 overflow-hidden line-clamp-2 italic">
              {edge.description}
            </p>
          </div>
          <Badge
            variant={stats.winRate >= WIN_RATE_THRESHOLD ? "default" : "destructive"}
            className={`${stats.winRate >= WIN_RATE_THRESHOLD ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"} transition-colors`}
          >
            {stats.winRate}% WR
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <Trophy className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-lg font-bold">{stats.totalTrades}</div>
            <div className="text-[10px] text-zinc-600 uppercase font-semibold">Trades</div>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <Clock className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-lg font-bold">{stats.avgDuration}m</div>
            <div className="text-[10px] text-zinc-600 uppercase font-semibold">Avg Time</div>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <CalendarCheck className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-sm font-bold pt-1 uppercase tracking-wider">
              {stats.bestDay.slice(0, 3)}
            </div>
            <div className="text-[10px] text-zinc-600 uppercase font-semibold">Best Day</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest px-1">Recent Logs</p>
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded border border-zinc-900/50">
                <span className={log.result === "WIN" ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                  {log.result}
                </span>
                <span className="text-zinc-500 font-mono">
                  {log.dayOfWeek.slice(0,3)} • {log.durationMinutes}m
                </span>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-zinc-700 italic px-1">No logs recorded yet.</div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 border-t border-zinc-900/50">
        <LogDialog
          edgeName={edge.name}
          onSave={onAddLog}
          trigger={
            <Button className="w-full gap-2 bg-white text-black hover:bg-zinc-200 font-bold tracking-tight">
              <Plus className="w-4 h-4" /> Log Trade
            </Button>
          }
        />

        {onDeleteLog && onUpdateLog && (
           <HistorySheet
             edge={edge}
             onDeleteLog={onDeleteLog}
             onUpdateLog={onUpdateLog}
           />
        )}
      </CardFooter>
    </Card>
  );
});
