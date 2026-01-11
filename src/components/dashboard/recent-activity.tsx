"use client";

import { useMemo } from "react";
import { ExternalLink, Check, X } from "lucide-react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { getTVImageUrl } from "@/lib/utils";

interface RecentActivityProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
  limit?: number;
}

export function RecentActivity({ logs, edgesWithLogs, limit = 5 }: RecentActivityProps) {
  const recentLogs = useMemo(() => {
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
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#0F0F0F]/5 h-fit">
      <div className="flex items-center gap-4 mb-6">
        <h3
          className="text-lg tracking-tight"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Recent Activity
        </h3>
        <div className="flex-1 h-px bg-[#0F0F0F]/10" />
      </div>

      {recentLogs.length === 0 ? (
        <p className="text-[#0F0F0F]/40 text-sm py-8 text-center">
          No activity yet. Log your first day to see it here.
        </p>
      ) : (
        <div className="space-y-4">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-[#0F0F0F]/[0.02] hover:bg-[#0F0F0F]/[0.04] transition-colors duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {log.result === "OCCURRED" ? (
                    <div className="w-7 h-7 rounded-full bg-[#8B9A7D]/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#8B9A7D]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#0F0F0F]/5 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-[#0F0F0F]/30" />
                    </div>
                  )}
                  <div>
                    <span
                      className="font-normal text-sm text-[#0F0F0F]"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {log.edgeName}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-[#0F0F0F]/40 mt-0.5">
                      <span>{log.dayOfWeek.slice(0, 3)}</span>
                      <span className="w-1 h-1 rounded-full bg-[#0F0F0F]/20" />
                      <span>{formatDate(log.date)}</span>
                    </div>
                  </div>
                </div>
                {log.tvLink && (
                  <a
                    href={log.tvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0F0F0F]/30 hover:text-[#C45A3B] transition-colors duration-300"
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
                  className="block mb-3 rounded-lg overflow-hidden border border-[#0F0F0F]/5 hover:border-[#0F0F0F]/10 transition-colors duration-300"
                >
                  <img
                    src={log.imageUrl}
                    alt="Chart snapshot"
                    className="w-full h-28 object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                  />
                </a>
              )}

              {/* Note */}
              {log.note && (
                <p className="text-xs text-[#0F0F0F]/40 line-clamp-2 italic">
                  &ldquo;{log.note}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
