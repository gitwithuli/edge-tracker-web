"use client";

import { useMemo, useState } from "react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { TRADING_DAYS } from "@/lib/constants";
import { Calendar, TrendingUp, Clock, Target, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import {
  DateRangeFilter,
  filterLogsByDateRange,
  getDefaultDateRange,
  type DateRange,
} from "./date-range-filter";
import Link from "next/link";

interface BacktestStatsProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
}

interface EdgeStats {
  id: string;
  name: string;
  totalLogs: number;
  occurred: number;
  occurrenceRate: number;
  avgDuration: number;
  occurrencesByDay: Record<string, { occurred: number; total: number }>;
  bestDay: { day: string; occurred: number; total: number } | null;
}

function calculateEdgeStats(edge: EdgeWithLogs, logs: TradeLog[]): EdgeStats {
  const edgeLogs = logs.filter(l => l.edgeId === edge.id);
  const totalLogs = edgeLogs.length;
  const occurred = edgeLogs.filter(l => l.result === 'OCCURRED').length;
  const occurrenceRate = totalLogs > 0 ? Math.round((occurred / totalLogs) * 100) : 0;

  const avgDuration = edgeLogs.length > 0
    ? Math.round(edgeLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / edgeLogs.length)
    : 0;

  const occurrencesByDay: Record<string, { occurred: number; total: number }> = {};
  TRADING_DAYS.forEach(day => {
    occurrencesByDay[day] = { occurred: 0, total: 0 };
  });

  edgeLogs.forEach(log => {
    if (occurrencesByDay[log.dayOfWeek]) {
      occurrencesByDay[log.dayOfWeek].total++;
      if (log.result === 'OCCURRED') {
        occurrencesByDay[log.dayOfWeek].occurred++;
      }
    }
  });

  const bestDay = Object.entries(occurrencesByDay)
    .filter(([, data]) => data.total >= 2)
    .sort((a, b) => {
      const rateA = a[1].total > 0 ? a[1].occurred / a[1].total : 0;
      const rateB = b[1].total > 0 ? b[1].occurred / b[1].total : 0;
      return rateB - rateA;
    })[0];

  return {
    id: edge.id,
    name: edge.name,
    totalLogs,
    occurred,
    occurrenceRate,
    avgDuration,
    occurrencesByDay,
    bestDay: bestDay ? { day: bestDay[0], ...bestDay[1] } : null,
  };
}

export function BacktestStats({ logs, edgesWithLogs }: BacktestStatsProps) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [expandedEdges, setExpandedEdges] = useState<Set<string>>(new Set());

  const toggleEdge = (edgeId: string) => {
    setExpandedEdges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(edgeId)) {
        newSet.delete(edgeId);
      } else {
        newSet.add(edgeId);
      }
      return newSet;
    });
  };

  const filteredLogs = useMemo(
    () => filterLogsByDateRange(logs, dateRange),
    [logs, dateRange]
  );

  const filteredEdgesWithLogs = useMemo(() => {
    return edgesWithLogs.map((edge) => ({
      ...edge,
      logs: filterLogsByDateRange(edge.logs, dateRange),
    }));
  }, [edgesWithLogs, dateRange]);

  const edgeStatsList = useMemo(() => {
    return filteredEdgesWithLogs
      .map(edge => calculateEdgeStats(edge, filteredLogs))
      .filter(stats => stats.totalLogs > 0)
      .sort((a, b) => b.occurrenceRate - a.occurrenceRate);
  }, [filteredEdgesWithLogs, filteredLogs]);

  const stats = useMemo(() => {
    const occurrencesByDay: Record<string, { occurred: number; total: number }> = {};
    const computedDateRange = { min: '', max: '' };

    TRADING_DAYS.forEach(day => {
      occurrencesByDay[day] = { occurred: 0, total: 0 };
    });

    filteredLogs.forEach(log => {
      if (occurrencesByDay[log.dayOfWeek]) {
        occurrencesByDay[log.dayOfWeek].total++;
        if (log.result === 'OCCURRED') {
          occurrencesByDay[log.dayOfWeek].occurred++;
        }
      }

      if (log.date) {
        if (!computedDateRange.min || log.date < computedDateRange.min) computedDateRange.min = log.date;
        if (!computedDateRange.max || log.date > computedDateRange.max) computedDateRange.max = log.date;
      }
    });

    const totalOccurred = filteredLogs.filter(l => l.result === 'OCCURRED').length;
    const totalLogs = filteredLogs.length;
    const occurrenceRate = totalLogs > 0 ? Math.round((totalOccurred / totalLogs) * 100) : 0;

    const avgDuration = filteredLogs.length > 0
      ? Math.round(filteredLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / filteredLogs.length)
      : 0;

    const bestDay = Object.entries(occurrencesByDay)
      .filter(([, data]) => data.total >= 2)
      .sort((a, b) => {
        const rateA = a[1].total > 0 ? a[1].occurred / a[1].total : 0;
        const rateB = b[1].total > 0 ? b[1].occurred / b[1].total : 0;
        return rateB - rateA;
      })[0];

    return {
      occurrencesByDay,
      dateRange: computedDateRange,
      totalOccurred,
      totalLogs,
      occurrenceRate,
      avgDuration,
      bestDay: bestDay ? { day: bestDay[0], ...bestDay[1] } : null,
    };
  }, [filteredLogs]);

  const formatDateRange = () => {
    if (!stats.dateRange.min || !stats.dateRange.max) return 'No data';
    const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (stats.dateRange.min === stats.dateRange.max) return formatDate(stats.dateRange.min);
    return `${formatDate(stats.dateRange.min)} - ${formatDate(stats.dateRange.max)}`;
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        {filteredLogs.length !== logs.length && (
          <span className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
            Showing {filteredLogs.length} of {logs.length} entries
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/50 dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Date Range</span>
          </div>
          <p className="text-sm font-medium text-[#0F0F0F] dark:text-white">{formatDateRange()}</p>
        </div>

        <div className="bg-white/50 dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#8B9A7D]" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Occurrence Rate</span>
          </div>
          <p className="text-2xl font-medium text-[#0F0F0F] dark:text-white">{stats.occurrenceRate}%</p>
          <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">{stats.totalOccurred} of {stats.totalLogs} days</p>
        </div>

        <div className="bg-white/50 dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Avg Duration</span>
          </div>
          <p className="text-2xl font-medium text-[#0F0F0F] dark:text-white">{stats.avgDuration}m</p>
          <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">per occurrence</p>
        </div>

        <div className="bg-white/50 dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#C45A3B]" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40">Best Day</span>
          </div>
          {stats.bestDay ? (
            <>
              <p className="text-lg font-medium text-[#0F0F0F] dark:text-white">{stats.bestDay.day}</p>
              <p className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                {Math.round((stats.bestDay.occurred / stats.bestDay.total) * 100)}% ({stats.bestDay.occurred}/{stats.bestDay.total})
              </p>
            </>
          ) : (
            <p className="text-sm text-[#0F0F0F]/40 dark:text-white/40">Need more data</p>
          )}
        </div>
      </div>

      {/* Edge Cards with embedded occurrence-by-day */}
      <div className="bg-white/50 dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 rounded-2xl p-6">
        <h3
          className="text-sm font-medium text-[#0F0F0F] dark:text-white mb-6"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Edge Breakdown
        </h3>

        {edgeStatsList.length === 0 ? (
          <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm py-4 text-center">
            No backtest data yet.
          </p>
        ) : (
          <div className="space-y-3">
            {edgeStatsList.map((edgeStats, index) => {
              const isExpanded = expandedEdges.has(edgeStats.id);
              const isTop = index === 0 && edgeStats.totalLogs >= 3;

              return (
                <div key={edgeStats.id}>
                  <div
                    onClick={() => toggleEdge(edgeStats.id)}
                    className="block p-4 rounded-xl bg-[#FAF7F2] dark:bg-white/[0.02] hover:bg-[#0F0F0F]/5 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
                        )}
                        {isTop && (
                          <span className="text-[10px] font-medium text-[#C45A3B] bg-[#C45A3B]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Top
                          </span>
                        )}
                        <h4
                          className="text-sm font-medium text-[#0F0F0F] dark:text-white group-hover:text-[#C45A3B] transition-colors"
                          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                        >
                          {edgeStats.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#0F0F0F]/30 dark:text-white/30">{edgeStats.totalLogs} days</span>
                        <Link
                          href={`/edge/${edgeStats.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[#0F0F0F]/30 dark:text-white/30 hover:text-[#C45A3B] transition-colors"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Occurrence Rate */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Target className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
                          <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider">
                            Occurrence
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#0F0F0F]/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#8B9A7D] rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(edgeStats.occurrenceRate, 2)}%` }}
                            />
                          </div>
                          <span
                            className="text-sm font-medium text-[#0F0F0F] dark:text-white min-w-[36px] text-right"
                            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                          >
                            {edgeStats.occurrenceRate}%
                          </span>
                        </div>
                        <p className="text-[10px] text-[#0F0F0F]/30 dark:text-white/30 mt-1">
                          {edgeStats.occurred} of {edgeStats.totalLogs} days
                        </p>
                      </div>

                      {/* Best Day + Avg Duration */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Calendar className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
                          <span className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider">
                            Best Day
                          </span>
                        </div>
                        {edgeStats.bestDay ? (
                          <>
                            <span
                              className="text-sm font-medium text-[#C45A3B]"
                              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                            >
                              {edgeStats.bestDay.day}
                            </span>
                            <p className="text-[10px] text-[#0F0F0F]/30 dark:text-white/30 mt-1">
                              {Math.round((edgeStats.bestDay.occurred / edgeStats.bestDay.total) * 100)}% rate
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-[#0F0F0F]/30 dark:text-white/30">Need more data</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Occurrence by Day */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pl-6 pt-3 pb-1 border-l-2 border-[#8B9A7D]/20 ml-4 mt-2">
                      <h5 className="text-[10px] text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-wider mb-3">
                        Occurrence by Day
                      </h5>
                      <div className="space-y-2">
                        {TRADING_DAYS.map(day => {
                          const data = edgeStats.occurrencesByDay[day];
                          const rate = data.total > 0 ? (data.occurred / data.total) * 100 : 0;
                          const isBestDay = edgeStats.bestDay?.day === day;

                          return (
                            <div key={day} className="flex items-center gap-3">
                              <span className={`w-10 text-[10px] font-medium ${isBestDay ? 'text-[#C45A3B]' : 'text-[#0F0F0F]/50 dark:text-white/50'}`}>
                                {day.slice(0, 3)}
                              </span>
                              <div className="flex-1 h-5 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-full overflow-hidden relative">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isBestDay ? 'bg-[#C45A3B]' : 'bg-[#8B9A7D]'
                                  }`}
                                  style={{ width: `${Math.max(rate, 2)}%` }}
                                />
                                {data.total > 0 && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#0F0F0F]/50 dark:text-white/50">
                                    {Math.round(rate)}%
                                  </span>
                                )}
                              </div>
                              <span className="w-12 text-[10px] text-[#0F0F0F]/30 dark:text-white/30 text-right">
                                {data.occurred}/{data.total}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
