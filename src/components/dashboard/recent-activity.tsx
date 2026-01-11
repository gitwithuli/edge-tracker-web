"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ExternalLink, Check, X } from "lucide-react";
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
      imageUrl: log.tvLink ? getTVImageUrl(log.tvLink) : null,
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
            No days logged yet. Log your first day to see activity.
          </p>
        ) : (
          <div className="space-y-4">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {log.result === "OCCURRED" ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                        <X className="w-3 h-3 text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-white text-sm">
                        {log.edgeName}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{log.dayOfWeek.slice(0, 3)}</span>
                        <span>•</span>
                        <span>{formatDate(log.date)}</span>
                      </div>
                    </div>
                  </div>
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

                {/* Inline TradingView Preview */}
                {log.imageUrl && (
                  <a
                    href={log.tvLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 mb-2 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <img
                      src={log.imageUrl}
                      alt="Chart snapshot"
                      className="w-full h-32 object-cover opacity-80 hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                  </a>
                )}

                {/* Note */}
                {log.note && (
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-2">
                    &ldquo;{log.note}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
