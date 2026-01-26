"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, TrendingUp, TrendingDown, ChevronDown, ChevronRight, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LogDialog } from "@/components/log-dialog";
import type { TradeLog, TradeLogInput, LogType, Edge } from "@/lib/types";
import { calculateLogPnL, formatPnL, parseDate } from "./calendar-utils";
import { getTVImageUrl } from "@/lib/utils";

interface CalendarDaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  logs: TradeLog[];
  edges: Edge[];
  defaultLogType: LogType;
  onAddLog: (edgeId: string, data: TradeLogInput) => void;
  onDeleteLog?: (logId: string) => void;
  onUpdateLog?: (logId: string, data: TradeLogInput, newEdgeId?: string) => void;
}

export function CalendarDaySheet({
  open,
  onOpenChange,
  date,
  logs,
  edges,
  defaultLogType,
  onAddLog,
  onDeleteLog,
  onUpdateLog,
}: CalendarDaySheetProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const dateObj = parseDate(date);
  const formattedDate = format(dateObj, "EEEE, MMMM d, yyyy");

  // Calculate daily totals
  const dailyStats = logs.reduce(
    (acc, log) => {
      if (log.result !== "OCCURRED") return acc;
      acc.trades++;
      if (log.outcome === "WIN") acc.wins++;
      if (log.outcome === "LOSS") acc.losses++;

      const { points, dollars } = calculateLogPnL(log);
      acc.pointsPnL += points;
      if (dollars !== null) {
        acc.dollarPnL += dollars;
        acc.hasDollarPnL = true;
      }
      return acc;
    },
    { trades: 0, wins: 0, losses: 0, pointsPnL: 0, dollarPnL: 0, hasDollarPnL: false }
  );

  const getEdgeName = (edgeId: string) => {
    return edges.find((e) => e.id === edgeId)?.name || "Unknown Edge";
  };

  const toggleLog = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#FAF7F2] dark:bg-[#0F0F0F] border-l border-[#0F0F0F]/10 dark:border-white/10 p-0 flex flex-col"
      >
        <SheetHeader className="p-6 pb-4 border-b border-[#0F0F0F]/10 dark:border-white/10">
          <SheetTitle
            className="text-lg text-[#0F0F0F] dark:text-white"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {formattedDate}
          </SheetTitle>

          {/* Daily summary */}
          {dailyStats.trades > 0 && (
            <div className="flex items-center gap-4 mt-3">
              <div
                className={`text-xl font-semibold ${
                  (dailyStats.hasDollarPnL ? dailyStats.dollarPnL : dailyStats.pointsPnL) >= 0
                    ? "text-[#8B9A7D]"
                    : "text-[#C45A3B]"
                }`}
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {formatPnL(
                  dailyStats.hasDollarPnL ? dailyStats.dollarPnL : dailyStats.pointsPnL,
                  dailyStats.hasDollarPnL
                )}
              </div>
              <div className="text-sm text-[#0F0F0F]/40 dark:text-white/40">
                {dailyStats.trades} trade{dailyStats.trades !== 1 ? "s" : ""}
                <span className="mx-2">·</span>
                <span className="text-[#8B9A7D]">{dailyStats.wins}W</span>
                {" / "}
                <span className="text-[#C45A3B]">{dailyStats.losses}L</span>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Trades list */}
        <div className="flex-1 overflow-y-auto p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#0F0F0F]/40 dark:text-white/40 mb-6">
                No trades logged for this day
              </p>
              <LogDialog
                defaultLogType={defaultLogType}
                onSave={(data, newEdgeId) => {
                  const targetEdgeId = newEdgeId || edges[0]?.id;
                  if (targetEdgeId) {
                    // Create log with the selected date
                    onAddLog(targetEdgeId, { ...data, date });
                    onOpenChange(false);
                  }
                }}
                trigger={
                  <button className="inline-flex items-center gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                    Log Trade
                  </button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {logs
                .filter((log) => log.result === "OCCURRED")
                .map((log) => {
                  const { points, dollars } = calculateLogPnL(log);
                  const isExpanded = expandedLogId === log.id;
                  const hasDetails = log.note || (log.tvLinks && log.tvLinks.length > 0);

                  return (
                    <div
                      key={log.id}
                      className="rounded-xl border border-[#0F0F0F]/10 dark:border-white/10 overflow-hidden"
                    >
                      {/* Trade header - clickable if has details */}
                      <button
                        onClick={() => hasDetails && toggleLog(log.id)}
                        className={`w-full p-4 text-left ${
                          hasDetails ? "hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 cursor-pointer" : "cursor-default"
                        } transition-colors`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            {/* Edge name */}
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-medium text-[#0F0F0F] dark:text-white"
                                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                              >
                                {getEdgeName(log.edgeId)}
                              </span>
                              {log.direction && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  log.direction === "LONG"
                                    ? "bg-[#8B9A7D]/10 text-[#8B9A7D]"
                                    : "bg-[#C45A3B]/10 text-[#C45A3B]"
                                }`}>
                                  {log.direction === "LONG" ? (
                                    <span className="flex items-center gap-0.5">
                                      <ArrowUpRight className="w-3 h-3" /> LONG
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5">
                                      <ArrowDownRight className="w-3 h-3" /> SHORT
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Outcome + symbol */}
                            <div className="flex items-center gap-2 text-xs text-[#0F0F0F]/40 dark:text-white/40">
                              <span
                                className={`flex items-center gap-1 ${
                                  log.outcome === "WIN" ? "text-[#8B9A7D]" : "text-[#C45A3B]"
                                }`}
                              >
                                {log.outcome === "WIN" ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {log.outcome}
                              </span>
                              {log.symbol && (
                                <>
                                  <span className="text-[#0F0F0F]/20 dark:text-white/20">·</span>
                                  <span>{log.symbol}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* P&L */}
                            <div
                              className={`text-sm font-semibold ${
                                (dollars ?? points) >= 0 ? "text-[#8B9A7D]" : "text-[#C45A3B]"
                              }`}
                              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                            >
                              {formatPnL(dollars ?? points, dollars !== null)}
                            </div>

                            {/* Expand indicator */}
                            {hasDetails && (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
                              )
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && hasDetails && (
                        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[#0F0F0F]/5 dark:border-white/5">
                          {/* Note */}
                          {log.note && (
                            <p className="text-sm text-[#0F0F0F]/60 dark:text-white/60 whitespace-pre-wrap pt-3">
                              {log.note}
                            </p>
                          )}

                          {/* TradingView links */}
                          {log.tvLinks && log.tvLinks.length > 0 && (
                            <div className="space-y-2 pt-2">
                              {log.tvLinks.map((link, idx) => {
                                const imageUrl = getTVImageUrl(link);
                                return (
                                  <div key={idx}>
                                    {imageUrl && (
                                      <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                                      >
                                        <img
                                          src={imageUrl}
                                          alt="TradingView chart"
                                          className="w-full h-auto"
                                          loading="lazy"
                                        />
                                      </a>
                                    )}
                                    {!imageUrl && (
                                      <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-[#C45A3B] hover:underline"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        View on TradingView
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Add trade button at the bottom */}
              <div className="pt-4">
                <LogDialog
                  defaultLogType={defaultLogType}
                  onSave={(data, newEdgeId) => {
                    const targetEdgeId = newEdgeId || edges[0]?.id;
                    if (targetEdgeId) {
                      onAddLog(targetEdgeId, { ...data, date });
                      onOpenChange(false);
                    }
                  }}
                  trigger={
                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#0F0F0F]/20 dark:border-white/20 text-[#0F0F0F]/40 dark:text-white/40 hover:border-[#0F0F0F]/40 dark:hover:border-white/40 hover:text-[#0F0F0F]/60 dark:hover:text-white/60 transition-colors text-sm">
                      <Plus className="w-4 h-4" />
                      Add Another Trade
                    </button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
