"use client";

import { useMemo, useState } from "react";
import type { TradeLog, EdgeWithLogs } from "@/lib/types";
import { TRADING_DAYS } from "@/lib/constants";
import { Calendar, TrendingUp, Clock, Target } from "lucide-react";
import {
  DateRangeFilter,
  filterLogsByDateRange,
  getDefaultDateRange,
  type DateRange,
} from "./date-range-filter";

interface BacktestStatsProps {
  logs: TradeLog[];
  edgesWithLogs: EdgeWithLogs[];
}

export function BacktestStats({ logs, edgesWithLogs }: BacktestStatsProps) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

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

  const stats = useMemo(() => {
    const occurrencesByDay: Record<string, { occurred: number; total: number }> = {};
    const occurrencesByEdge: Record<string, { name: string; occurred: number; total: number }> = {};
    const computedDateRange = { min: '', max: '' };

    TRADING_DAYS.forEach(day => {
      occurrencesByDay[day] = { occurred: 0, total: 0 };
    });

    filteredEdgesWithLogs.forEach(edge => {
      occurrencesByEdge[edge.id] = { name: edge.name, occurred: 0, total: 0 };
    });

    filteredLogs.forEach(log => {
      if (occurrencesByDay[log.dayOfWeek]) {
        occurrencesByDay[log.dayOfWeek].total++;
        if (log.result === 'OCCURRED') {
          occurrencesByDay[log.dayOfWeek].occurred++;
        }
      }

      if (occurrencesByEdge[log.edgeId]) {
        occurrencesByEdge[log.edgeId].total++;
        if (log.result === 'OCCURRED') {
          occurrencesByEdge[log.edgeId].occurred++;
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

    const bestEdge = Object.entries(occurrencesByEdge)
      .filter(([, data]) => data.total >= 2)
      .sort((a, b) => {
        const rateA = a[1].total > 0 ? a[1].occurred / a[1].total : 0;
        const rateB = b[1].total > 0 ? b[1].occurred / b[1].total : 0;
        return rateB - rateA;
      })[0];

    return {
      occurrencesByDay,
      occurrencesByEdge,
      dateRange: computedDateRange,
      totalOccurred,
      totalLogs,
      occurrenceRate,
      avgDuration,
      bestDay: bestDay ? { day: bestDay[0], ...bestDay[1] } : null,
      bestEdge: bestEdge ? { id: bestEdge[0], ...bestEdge[1] } : null,
    };
  }, [filteredLogs, filteredEdgesWithLogs]);

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
          <span className="text-xs text-[#0F0F0F]/40">
            Showing {filteredLogs.length} of {logs.length} entries
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/50 border border-[#0F0F0F]/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-[#0F0F0F]/30" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Date Range</span>
          </div>
          <p className="text-sm font-medium text-[#0F0F0F]">{formatDateRange()}</p>
        </div>

        <div className="bg-white/50 border border-[#0F0F0F]/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#8B9A7D]" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Occurrence Rate</span>
          </div>
          <p className="text-2xl font-medium text-[#0F0F0F]">{stats.occurrenceRate}%</p>
          <p className="text-xs text-[#0F0F0F]/40">{stats.totalOccurred} of {stats.totalLogs} days</p>
        </div>

        <div className="bg-white/50 border border-[#0F0F0F]/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#0F0F0F]/30" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Avg Duration</span>
          </div>
          <p className="text-2xl font-medium text-[#0F0F0F]">{stats.avgDuration}m</p>
          <p className="text-xs text-[#0F0F0F]/40">per occurrence</p>
        </div>

        <div className="bg-white/50 border border-[#0F0F0F]/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#C45A3B]" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#0F0F0F]/40">Best Day</span>
          </div>
          {stats.bestDay ? (
            <>
              <p className="text-lg font-medium text-[#0F0F0F]">{stats.bestDay.day}</p>
              <p className="text-xs text-[#0F0F0F]/40">
                {Math.round((stats.bestDay.occurred / stats.bestDay.total) * 100)}% ({stats.bestDay.occurred}/{stats.bestDay.total})
              </p>
            </>
          ) : (
            <p className="text-sm text-[#0F0F0F]/40">Need more data</p>
          )}
        </div>
      </div>

      {/* Occurrence by Day Chart */}
      <div className="bg-white/50 border border-[#0F0F0F]/5 rounded-2xl p-6">
        <h3
          className="text-sm font-medium text-[#0F0F0F] mb-6"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Occurrence by Day
        </h3>
        <div className="space-y-4">
          {TRADING_DAYS.map(day => {
            const data = stats.occurrencesByDay[day];
            const rate = data.total > 0 ? (data.occurred / data.total) * 100 : 0;
            const isBestDay = stats.bestDay?.day === day;

            return (
              <div key={day} className="flex items-center gap-4">
                <span className={`w-12 text-xs font-medium ${isBestDay ? 'text-[#C45A3B]' : 'text-[#0F0F0F]/60'}`}>
                  {day.slice(0, 3)}
                </span>
                <div className="flex-1 h-8 bg-[#0F0F0F]/5 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBestDay ? 'bg-[#C45A3B]' : 'bg-[#8B9A7D]'
                    }`}
                    style={{ width: `${Math.max(rate, 2)}%` }}
                  />
                  {data.total > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#0F0F0F]/60">
                      {Math.round(rate)}%
                    </span>
                  )}
                </div>
                <span className="w-16 text-xs text-[#0F0F0F]/40 text-right">
                  {data.occurred}/{data.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Occurrence by Edge */}
      {Object.keys(stats.occurrencesByEdge).length > 1 && (
        <div className="bg-white/50 border border-[#0F0F0F]/5 rounded-2xl p-6">
          <h3
            className="text-sm font-medium text-[#0F0F0F] mb-6"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Occurrence by Edge
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.occurrencesByEdge)
              .filter(([, data]) => data.total > 0)
              .sort((a, b) => {
                const rateA = a[1].total > 0 ? a[1].occurred / a[1].total : 0;
                const rateB = b[1].total > 0 ? b[1].occurred / b[1].total : 0;
                return rateB - rateA;
              })
              .map(([id, data]) => {
                const rate = data.total > 0 ? (data.occurred / data.total) * 100 : 0;
                const isBest = stats.bestEdge?.id === id;

                return (
                  <div key={id} className="flex items-center gap-4">
                    <span className={`w-32 text-xs font-medium truncate ${isBest ? 'text-[#C45A3B]' : 'text-[#0F0F0F]/60'}`}>
                      {data.name}
                    </span>
                    <div className="flex-1 h-8 bg-[#0F0F0F]/5 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isBest ? 'bg-[#C45A3B]' : 'bg-[#8B9A7D]'
                        }`}
                        style={{ width: `${Math.max(rate, 2)}%` }}
                      />
                      {data.total > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#0F0F0F]/60">
                          {Math.round(rate)}%
                        </span>
                      )}
                    </div>
                    <span className="w-16 text-xs text-[#0F0F0F]/40 text-right">
                      {data.occurred}/{data.total}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
