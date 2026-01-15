"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Check, X, ChevronDown, ChevronRight, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpanded = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

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
          {recentLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const hasPrices = log.entryPrice != null && log.exitPrice != null;
            const hasTimes = log.entryTime || log.exitTime;
            const hasOHLC = log.dailyOpen != null || log.dailyHigh != null || log.dailyLow != null || log.dailyClose != null;

            return (
              <div
                key={log.id}
                className={`rounded-xl bg-[#0F0F0F]/[0.02] transition-all duration-300 ${
                  isExpanded ? 'bg-white border border-[#0F0F0F]/10 shadow-sm' : 'hover:bg-[#0F0F0F]/[0.04]'
                }`}
              >
                {/* Clickable Header */}
                <button
                  onClick={() => toggleExpanded(log.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Expand indicator */}
                      <div className="w-5 h-5 flex items-center justify-center text-[#0F0F0F]/30">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
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
                      {/* TV link indicator */}
                      {log.firstTvLink && (
                        <span className="text-[10px] text-[#0F0F0F]/30 bg-[#0F0F0F]/5 px-1.5 py-0.5 rounded">
                          {log.tvLinksCount > 1 ? `${log.tvLinksCount} charts` : 'chart'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-4 pb-4 pt-0 space-y-4">
                    {/* TradingView Preview */}
                    {log.imageUrl && (
                      <a
                        href={log.firstTvLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-[#0F0F0F]/5 hover:border-[#0F0F0F]/10 transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={log.imageUrl}
                          alt="Chart snapshot"
                          className="w-full h-40 object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
                          loading="lazy"
                        />
                      </a>
                    )}

                    {/* Trade Details Grid */}
                    {(hasPrices || hasTimes || hasOHLC) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Direction */}
                        {log.direction && (
                          <div className="p-2.5 rounded-lg bg-[#0F0F0F]/[0.02]">
                            <p className="text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider mb-1">Direction</p>
                            <p className="text-xs font-medium flex items-center gap-1">
                              {log.direction === 'LONG' ? (
                                <><ArrowUpRight className="w-3 h-3 text-[#8B9A7D]" /> Long</>
                              ) : (
                                <><ArrowDownRight className="w-3 h-3 text-[#C45A3B]" /> Short</>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Entry Price */}
                        {log.entryPrice != null && (
                          <div className="p-2.5 rounded-lg bg-[#0F0F0F]/[0.02]">
                            <p className="text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider mb-1">Entry</p>
                            <p className="text-xs font-medium">{log.entryPrice.toFixed(2)}</p>
                            {log.entryTime && <p className="text-[10px] text-[#0F0F0F]/30">{log.entryTime}</p>}
                          </div>
                        )}

                        {/* Exit Price */}
                        {log.exitPrice != null && (
                          <div className="p-2.5 rounded-lg bg-[#0F0F0F]/[0.02]">
                            <p className="text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider mb-1">Exit</p>
                            <p className="text-xs font-medium">{log.exitPrice.toFixed(2)}</p>
                            {log.exitTime && <p className="text-[10px] text-[#0F0F0F]/30">{log.exitTime}</p>}
                          </div>
                        )}

                        {/* P&L */}
                        {log.tradePnl !== null && (
                          <div className="p-2.5 rounded-lg bg-[#0F0F0F]/[0.02]">
                            <p className="text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider mb-1">P&L</p>
                            <p className={`text-xs font-medium ${log.tradePnl >= 0 ? 'text-[#8B9A7D]' : 'text-[#C45A3B]'}`}>
                              {log.tradePnl >= 0 ? '+' : ''}{log.tradePnl.toFixed(2)} pts
                            </p>
                            {log.dollarPnl !== null && (
                              <p className="text-[10px] text-[#0F0F0F]/30">{formatCurrencyCompact(log.dollarPnl)}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* OHLC Row */}
                    {hasOHLC && (
                      <div className="grid grid-cols-4 gap-2">
                        {log.dailyOpen != null && (
                          <div className="p-2 rounded-lg bg-[#0F0F0F]/[0.02] text-center">
                            <p className="text-[9px] text-[#0F0F0F]/40 uppercase">Open</p>
                            <p className="text-[10px] font-medium">{log.dailyOpen.toFixed(2)}</p>
                          </div>
                        )}
                        {log.dailyHigh != null && (
                          <div className="p-2 rounded-lg bg-[#8B9A7D]/5 text-center">
                            <p className="text-[9px] text-[#8B9A7D]/60 uppercase">High</p>
                            <p className="text-[10px] font-medium text-[#8B9A7D]">{log.dailyHigh.toFixed(2)}</p>
                          </div>
                        )}
                        {log.dailyLow != null && (
                          <div className="p-2 rounded-lg bg-[#C45A3B]/5 text-center">
                            <p className="text-[9px] text-[#C45A3B]/60 uppercase">Low</p>
                            <p className="text-[10px] font-medium text-[#C45A3B]">{log.dailyLow.toFixed(2)}</p>
                          </div>
                        )}
                        {log.dailyClose != null && (
                          <div className="p-2 rounded-lg bg-[#0F0F0F]/[0.02] text-center">
                            <p className="text-[9px] text-[#0F0F0F]/40 uppercase">Close</p>
                            <p className="text-[10px] font-medium">{log.dailyClose.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Note */}
                    {log.note && (
                      <p className="text-xs text-[#0F0F0F]/50 italic bg-[#0F0F0F]/[0.02] p-3 rounded-lg">
                        &ldquo;{log.note}&rdquo;
                      </p>
                    )}

                    {/* Multiple TV Links */}
                    {log.tvLinksCount > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {(log.tvLinks || []).map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-[#0F0F0F]/40 hover:text-[#C45A3B] transition-colors px-2 py-1 rounded-full bg-[#0F0F0F]/5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Chart {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* View Edge Link */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#0F0F0F]/5">
                      <span className="text-[10px] text-[#0F0F0F]/30 uppercase tracking-wider">
                        {log.logType === 'BACKTEST' ? 'Backtest' : 'Live'} • {log.date}
                      </span>
                      <Link
                        href={`/edge/${log.edgeId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-[#C45A3B] hover:underline"
                      >
                        View Edge
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
