"use client";

import { useMemo } from "react";
import { Clock, TrendingUp, TrendingDown, X, ExternalLink } from "lucide-react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/utils";
import { getSymbolInfo } from "@/lib/constants";
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
        const contracts = log.positionSize || 1;
        const symbolInfo = log.symbol ? getSymbolInfo(log.symbol) : null;
        if (symbolInfo) {
          dollarPnl = tradePnl * symbolInfo.multiplier * contracts;
        }
      }

      return {
        ...log,
        edgeName: edgeNames[log.edgeId] || "Unknown Edge",
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
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 h-fit">
      <div className="flex items-center gap-4 mb-6">
        <h3
          className="text-lg tracking-tight dark:text-white"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Recent Activity
        </h3>
        <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />
      </div>

      {recentLogs.length === 0 ? (
        <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm py-8 text-center">
          No activity yet. Log your first day to see it here.
        </p>
      ) : (
        <div className="space-y-2">
          {recentLogs.map((log) => (
            <Link
              key={log.id}
              href={`/edge/${log.edgeId}?log=${log.id}`}
              className="block p-3 rounded-xl bg-[#0F0F0F]/[0.02] dark:bg-white/[0.02] hover:bg-[#0F0F0F]/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-300"
            >
              {/* Row 1: Icon + Name + P&L */}
              <div className="flex items-center gap-3">
                {log.result === "OCCURRED" ? (
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    log.outcome === "WIN" ? "bg-[#8B9A7D]/20" : "bg-[#C45A3B]/20"
                  }`}>
                    {log.outcome === "WIN" ? (
                      <TrendingUp className="w-4 h-4 text-[#8B9A7D]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-[#C45A3B]" />
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 bg-[#0F0F0F]/5 dark:bg-white/5 flex items-center justify-center">
                    <X className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-normal text-sm text-[#0F0F0F] dark:text-white truncate"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {log.edgeName}
                    </span>
                    {log.tradePnl !== null && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        log.tradePnl >= 0 ? 'text-[#8B9A7D] bg-[#8B9A7D]/10' : 'text-[#C45A3B] bg-[#C45A3B]/10'
                      }`}>
                        {log.dollarPnl !== null
                          ? formatCurrencyCompact(log.dollarPnl)
                          : `${log.tradePnl >= 0 ? '+' : ''}${log.tradePnl.toFixed(1)}`
                        }
                      </span>
                    )}
                  </div>

                  {/* Row 2: Meta info */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#0F0F0F]/40 dark:text-white/40">
                      <span>{log.dayOfWeek.slice(0, 3)}</span>
                      <span>•</span>
                      <span>{formatDate(log.date)}</span>
                      {log.result === "OCCURRED" && log.durationMinutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {log.durationMinutes}m
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {log.firstTvLink && (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(log.firstTvLink!, '_blank');
                          }}
                          className="text-[10px] text-[#0F0F0F]/30 dark:text-white/30 hover:text-[#C45A3B] bg-[#0F0F0F]/5 dark:bg-white/5 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {log.tvLinksCount > 1 ? log.tvLinksCount : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
