import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, CalendarCheck, Plus } from "lucide-react";
import { Edge } from "@/lib/types";
import { LogDialog } from "./log-dialog";
import { HistorySheet } from "./history-sheet";

interface EdgeCardProps {
  edge: Edge;
  onAddLog: (data: any) => void;
  onDeleteLog: (id: string | number) => void;
  onUpdateLog: (id: string, data: any) => void;
}

export function EdgeCard({ edge, onAddLog, onDeleteLog, onUpdateLog }: EdgeCardProps) {
  const totalTrades = edge.logs.length;
  const wins = edge.logs.filter((l) => l.result === "WIN").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const totalDuration = edge.logs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const avgDuration = totalTrades > 0 ? Math.round(totalDuration / totalTrades) : 0;
  const dayCounts: Record<string, number> = {};
  edge.logs.filter(l => l.result === "WIN").forEach(l => {
    dayCounts[l.dayOfWeek] = (dayCounts[l.dayOfWeek] || 0) + 1;
  });
  const bestDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b, "N/A");
  const recentLogs = edge.logs.slice(0, 2);

  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{edge.name}</CardTitle>
            <p className="text-xs text-zinc-500 mt-1 h-10">{edge.description}</p>
          </div>
          <Badge variant={winRate > 50 ? "default" : "destructive"} className={winRate > 50 ? "bg-green-600" : "bg-red-600"}>
            {winRate}% WR
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <Trophy className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-lg font-bold">{totalTrades}</div>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <Clock className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-lg font-bold">{avgDuration}m</div>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-lg text-center border border-zinc-800/50">
            <CalendarCheck className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
            <div className="text-sm font-bold pt-1">{bestDay.slice(0, 3)}</div>
          </div>
        </div>
        <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded border border-zinc-800/50">
                <span className={log.result === "WIN" ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{log.result}</span>
                <span className="text-zinc-400">{log.dayOfWeek} • {log.durationMinutes}m</span>
              </div>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2">
        <LogDialog edgeName={edge.name} onSave={onAddLog} trigger={
          <Button variant="secondary" size="sm" className="w-full gap-2 bg-zinc-100 text-zinc-900 hover:bg-white font-medium">
            <Plus className="w-4 h-4" /> Log Trade
          </Button>
        } />
        <HistorySheet edge={edge} onDeleteLog={onDeleteLog} onUpdateLog={onUpdateLog} />
      </CardFooter>
    </Card>
  );
}