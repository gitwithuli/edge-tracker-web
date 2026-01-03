import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edge } from "@/lib/types";
import { LogDialog } from "./log-dialog";
import { Trophy, Clock, CalendarCheck } from "lucide-react";

interface EdgeCardProps {
  edge: Edge;
  onAddLog: (log: any) => void;
}

export function EdgeCard({ edge, onAddLog }: EdgeCardProps) {
  const totalTrades = edge.logs.length;
  const wins = edge.logs.filter((l) => l.result === "WIN").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  // Calculate Average Duration
  const totalDuration = edge.logs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const avgDuration = totalTrades > 0 ? Math.round(totalDuration / totalTrades) : 0;

  // Calculate Best Day
  const dayStats: Record<string, { wins: number; total: number }> = {};
  edge.logs.forEach((log) => {
    if (!dayStats[log.dayOfWeek]) dayStats[log.dayOfWeek] = { wins: 0, total: 0 };
    dayStats[log.dayOfWeek].total++;
    if (log.result === "WIN") dayStats[log.dayOfWeek].wins++;
  });

  let bestDay = "N/A";
  let bestDayRate = -1;

  Object.entries(dayStats).forEach(([day, stats]) => {
    const rate = stats.total > 0 ? stats.wins / stats.total : 0;
    if (rate > bestDayRate) {
      bestDayRate = rate;
      bestDay = day;
    }
  });

  return (
    <Card className="flex flex-col h-full bg-zinc-900 border-zinc-800 text-zinc-100">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{edge.name}</CardTitle>
            <CardDescription className="text-zinc-400 mt-1">{edge.description}</CardDescription>
          </div>
          <Badge variant={winRate > 50 ? "default" : "destructive"} className="text-md px-3 py-1">
            {winRate}% WR
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
            <div className="flex justify-center mb-1 text-zinc-500"><Trophy className="w-4 h-4" /></div>
            <div className="text-lg font-bold">{totalTrades}</div>
            <div className="text-xs text-zinc-500">Total Trades</div>
          </div>
          <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
            <div className="flex justify-center mb-1 text-zinc-500"><Clock className="w-4 h-4" /></div>
            <div className="text-lg font-bold">{avgDuration}m</div>
            <div className="text-xs text-zinc-500">Avg Duration</div>
          </div>
          <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
            <div className="flex justify-center mb-1 text-zinc-500"><CalendarCheck className="w-4 h-4" /></div>
            <div className="text-lg font-bold truncate px-1">{bestDay.slice(0, 3)}</div>
            <div className="text-xs text-zinc-500">Best Day</div>
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Recent Logs</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {edge.logs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex justify-between items-center text-sm p-2 bg-zinc-950 rounded border border-zinc-800">
                <span className={`font-bold ${log.result === "WIN" ? "text-green-500" : log.result === "LOSS" ? "text-red-500" : "text-yellow-500"}`}>
                  {log.result}
                </span>
                <span className="text-zinc-400 text-xs">{log.dayOfWeek} • {log.durationMinutes}m</span>
              </div>
            ))}
            {edge.logs.length === 0 && <p className="text-zinc-600 text-sm italic">No trades logged yet.</p>}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <LogDialog edgeName={edge.name} onSave={(data) => onAddLog(data)} />
      </CardFooter>
    </Card>
  );
}