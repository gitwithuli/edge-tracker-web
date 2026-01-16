"use client";

import { useMemo } from "react";
import { ExternalLink, Clock, TrendingUp, TrendingDown, X } from "lucide-react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { getTVImageUrl, formatCurrencyCompact } from "@/lib/utils";
import { FUTURES_SYMBOLS, type FuturesSymbol } from "@/lib/constants";
import Link from "next/link";

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

    return logs.slice(0, limit).map(log => {
      const tvLinks = log.tvLinks || (log.tvLink ? [log.tvLink] : []);
      const firstLink = tvLinks[0] || null;

      // Calculate P&L if prices are available
      let tradePnl: number | null = null;
      let dollarPnl: number | null = null;
      if (log.entryPrice != null && log.exitPrice != null && log.direction) {
        tradePnl = log.direction === 'LONG'
          ? log.exitPrice - log.entryPrice
          : log.entryPrice - log.exitPrice;
        const logSymbol = log.symbol as FuturesSymbol | null;
        const contracts = log.positionSize || 1;
        if (logSymbol && FUTURES_SYMBOLS[logSymbol]) {
          dollarPnl = tradePnl * FUTURES_SYMBOLS[logSymbol].multiplier * contracts;
        }
      }

      return {
        ...log,
        edgeName: edgeNames[log.edgeId] || "Unknown Edge",
        imageUrl: firstLink ? getTVImageUrl(firstLink) : null,
        firstTvLink: firstLink,
        tvLinksCount: tvLinks.length,
        tradePnl,
        dollarPnl,
      };
    });
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
        <div className="space-y-3">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-[#0F0F0F]/[0.02] hover:bg-[#0F0F0F]/[0.04] transition-colors duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {log.result === "OCCURRED" ? (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      log.outcome === "WIN" ? "bg-[#8B9A7D]/20" : "bg-[#C45A3B]/20"
                    }`}>
                      {log.outcome === "WIN" ? (
                        <TrendingUp className="w-3.5 h-3.5 text-[#8B9A7D]" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-[#C45A3B]" />
                      )}
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
                      {log.result === "OCCURRED" && log.durationMinutes && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[#0F0F0F]/20" />
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {log.durationMinutes}m
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* P&L badge if available */}
                  {log.tradePnl !== null && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      log.tradePnl >= 0 ? 'text-[#8B9A7D] bg-[#8B9A7D]/10' : 'text-[#C45A3B] bg-[#C45A3B]/10'
                    }`}>
                      {log.dollarPnl !== null
                        ? formatCurrencyCompact(log.dollarPnl)
                        : `${log.tradePnl >= 0 ? '+' : ''}${log.tradePnl.toFixed(1)}`
                      }
                    </span>
                  )}
                  {/* TV link */}
                  {log.firstTvLink && (
                    <a
                      href={log.firstTvLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#0F0F0F]/30 hover:text-[#C45A3B] bg-[#0F0F0F]/5 px-1.5 py-0.5 rounded transition-colors"
                    >
                      {log.tvLinksCount > 1 ? `${log.tvLinksCount} charts` : 'chart'}
                    </a>
                  )}
                  {/* View Edge link */}
                  <Link
                    href={`/edge/${log.edgeId}`}
                    className="text-[10px] text-[#C45A3B] hover:underline"
                  >
                    view
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
