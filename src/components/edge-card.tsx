"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CalendarCheck, Plus, Check, X } from "lucide-react";
import type { EdgeWithLogs, TradeLogInput } from "@/lib/types";
import { LogDialog } from "./log-dialog";
import { HistorySheet } from "./history-sheet";
import { calculateEdgeStats } from "@/lib/edge-stats";

interface EdgeCardProps {
  edge: EdgeWithLogs;
  onAddLog: (data: TradeLogInput) => void;
  onDeleteLog?: (id: string) => void;
  onUpdateLog?: (id: string, data: TradeLogInput) => void;
}

export const EdgeCard = memo(function EdgeCard({ edge, onAddLog, onDeleteLog, onUpdateLog }: EdgeCardProps) {
  const stats = useMemo(() => {
    // Use edge's createdAt for proper occurrence rate calculation
    const baseStats = calculateEdgeStats(edge.logs, edge.createdAt);
    const { occurred: occurrences, occurrenceRate, tradingDays } = baseStats;

    const occurredLogs = edge.logs.filter(l => l.result === "OCCURRED");
    const totalDuration = occurredLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
    const avgDuration = occurrences > 0 ? Math.round(totalDuration / occurrences) : 0;

    // Best day by occurrence count (not win rate)
    const dayCounts: Record<string, number> = {};
    occurredLogs.forEach(l => {
      dayCounts[l.dayOfWeek] = (dayCounts[l.dayOfWeek] || 0) + 1;
    });

    const bestDay = Object.keys(dayCounts).length > 0
      ? Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b)
      : "N/A";

    return { tradingDays, occurrences, occurrenceRate, avgDuration, bestDay };
  }, [edge.logs, edge.createdAt]);

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
          <Badge className="bg-emerald-600 hover:bg-emerald-500 transition-colors">
            {stats.occurrenceRate}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-lg font-bold">{stats.tradingDays}</div>
            <div className="text-[10px] text-zinc-600 uppercase font-semibold">Trading Days</div>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <Clock className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-lg font-bold">{stats.occurrences}</div>
            <div className="text-[10px] text-zinc-600 uppercase font-semibold">Occurrences</div>
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
                <span className="flex items-center gap-1">
                  {log.result === "OCCURRED" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <X className="w-3 h-3 text-zinc-500" />
                  )}
                  <span className={log.result === "OCCURRED" ? "text-emerald-500 font-bold" : "text-zinc-500 font-bold"}>
                    {log.result === "OCCURRED" ? "Occurred" : "No Setup"}
                  </span>
                </span>
                <span className="text-zinc-500 font-mono">
                  {log.dayOfWeek.slice(0,3)} {log.durationMinutes > 0 && `• ${log.durationMinutes}m`}
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
          edgeId={edge.id}
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
