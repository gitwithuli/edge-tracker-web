"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ExternalLink, ImageIcon } from "lucide-react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { getTVImageUrl } from "@/lib/utils";

interface RecentActivityProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
  limit?: number;
}

export function RecentActivity({ logs, edgesWithLogs, limit = 5 }: RecentActivityProps) {
  const recentLogs = useMemo(() => {
    // Get edge name lookup
    const edgeNames: Record<string, string> = {};
    edgesWithLogs.forEach(e => {
      edgeNames[e.id] = e.name;
    });

    return logs.slice(0, limit).map(log => ({
      ...log,
      edgeName: edgeNames[log.edgeId] || "Unknown Edge",
      hasImage: !!log.tvLink && !!getTVImageUrl(log.tvLink),
    }));
  }, [logs, edgesWithLogs, limit]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          RECENT ACTIVITY
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentLogs.length === 0 ? (
          <p className="text-zinc-600 text-sm italic py-4">
            No trades logged yet. Log your first trade to see activity.
          </p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-900/50 transition-colors"
              >
                {/* Result indicator */}
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    log.result === "WIN"
                      ? "bg-green-500"
                      : log.result === "LOSS"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">
                      {log.edgeName}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        log.result === "WIN"
                          ? "text-green-500"
                          : log.result === "LOSS"
                          ? "text-red-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {log.result}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {log.dayOfWeek.slice(0, 3)}
                    </span>
                  </div>

                  {log.note && (
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                      &ldquo;{log.note}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-600">
                      {formatDate(log.date)}
                    </span>
                    {log.hasImage && (
                      <span className="text-xs text-zinc-600 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Chart
                      </span>
                    )}
                  </div>
                </div>

                {/* TV Link */}
                {log.tvLink && (
                  <a
                    href={log.tvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
