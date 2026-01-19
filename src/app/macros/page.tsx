"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMacroTime } from "@/hooks/use-macro-time";
import { useMacroStore, MacroLog, MacroLogInput, MacroDirection, DisplacementQuality, LiquiditySweep } from "@/hooks/use-macro-store";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { formatMacroTime, MacroWindow, MACRO_DIRECTIONS, DISPLACEMENT_QUALITIES, LIQUIDITY_SWEEPS } from "@/lib/macro-constants";
import { Clock, Timer, TrendingDown, Minus, ChevronLeft, Check, Link as LinkIcon, Plus, Trash2, ExternalLink, ArrowUp, ArrowDown, Activity, BarChart3, Settings, Moon, Download, Upload } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTVImageUrl } from "@/lib/utils";

function MacroCard({
  macro,
  status,
  minutesUntil,
  minutesRemaining,
  secondsRemaining,
  todayLog,
  onLog,
  onAddTvLink,
  onRemoveTvLink,
}: {
  macro: MacroWindow;
  status: 'upcoming' | 'active' | 'passed';
  minutesUntil: number;
  minutesRemaining: number;
  secondsRemaining?: number;
  todayLog?: MacroLog;
  onLog: (data: MacroLogInput) => void;
  onAddTvLink: (link: string) => void;
  onRemoveTvLink: (index: number) => void;
}) {
  const [newLink, setNewLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [pointsInput, setPointsInput] = useState('');
  const isRTH = macro.category === 'rth_close';
  const hasLog = !!todayLog && (todayLog.direction !== null || todayLog.pointsMoved !== null);
  const showLogSection = status === 'active' || status === 'passed';
  const tvLinks = todayLog?.tvLinks || [];

  const getDirectionDisplay = () => {
    if (!todayLog?.direction) return null;
    const styles: Record<MacroDirection, { bg: string; text: string; icon: React.ReactNode }> = {
      BULLISH: { bg: 'bg-[#8B9A7D]', text: 'text-white', icon: <ArrowUp className="w-3 h-3" /> },
      BEARISH: { bg: 'bg-[#C45A3B]', text: 'text-white', icon: <ArrowDown className="w-3 h-3" /> },
      CONSOLIDATION: { bg: 'bg-[#0F0F0F]/20', text: 'text-[#0F0F0F]', icon: <Minus className="w-3 h-3" /> },
    };
    return styles[todayLog.direction];
  };

  const directionStyle = getDirectionDisplay();

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5 transition-all duration-500",
        status === 'active'
          ? "bg-[#C45A3B]/10 border-[#C45A3B] shadow-lg shadow-[#C45A3B]/10"
          : status === 'upcoming'
            ? "bg-white/50 dark:bg-white/[0.03] border-[#0F0F0F]/10 dark:border-white/10 hover:border-[#0F0F0F]/20 dark:hover:border-white/20"
            : hasLog
              ? "bg-white/30 dark:bg-white/[0.02] border-[#0F0F0F]/10 dark:border-white/10"
              : "bg-[#0F0F0F]/5 dark:bg-white/5 border-[#0F0F0F]/5 dark:border-white/5 opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isRTH && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C45A3B]/10 text-[#C45A3B] font-medium uppercase tracking-wider">
                RTH Close
              </span>
            )}
            {status === 'active' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B9A7D] text-white font-medium uppercase tracking-wider animate-pulse">
                Live
              </span>
            )}
            {hasLog && status !== 'active' && directionStyle && (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider flex items-center gap-1",
                directionStyle.bg,
                directionStyle.text
              )}>
                {directionStyle.icon}
                {todayLog!.direction}
                {todayLog!.pointsMoved !== null && ` (${todayLog!.pointsMoved}pts)`}
              </span>
            )}
          </div>
          <h3
            className={cn(
              "text-base sm:text-lg font-medium",
              status === 'passed' && !hasLog ? "text-[#0F0F0F]/40 dark:text-white/40" : "text-[#0F0F0F] dark:text-white"
            )}
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {macro.name}
          </h3>
        </div>

        <div className={cn(
          "text-right flex-shrink-0",
          status === 'active' ? "text-[#C45A3B]" : "text-[#0F0F0F]/40 dark:text-white/40"
        )}>
          <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 sm:mb-1">
            {status === 'active' ? 'Remaining' : status === 'upcoming' ? 'Starts in' : 'Ended'}
          </div>
          {status !== 'passed' && (
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums">
              {status === 'active'
                ? `${minutesRemaining}m`
                : `${minutesUntil}m ${secondsRemaining !== undefined ? `${secondsRemaining}s` : ''}`
              }
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#0F0F0F]/50 dark:text-white/50">
        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span>
          {formatMacroTime(macro.startHour, macro.startMinute)} — {formatMacroTime(macro.endHour, macro.endMinute)}
        </span>
      </div>

      {showLogSection && (
        <div className={cn(
          "mt-4 pt-4 border-t space-y-4",
          status === 'active' ? "border-[#C45A3B]/20" : "border-[#0F0F0F]/10 dark:border-white/10"
        )}>
          {/* Points Moved */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2">
              Points Moved
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={todayLog?.pointsMoved !== null ? todayLog?.pointsMoved : pointsInput}
                onChange={(e) => {
                  setPointsInput(e.target.value);
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  onLog({ pointsMoved: val });
                }}
                placeholder="e.g. 15"
                className="flex-1 h-10 px-3 text-sm bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#C45A3B] placeholder:text-[#0F0F0F]/30 dark:placeholder:text-white/30 dark:text-white"
              />
              <span className="h-10 px-3 flex items-center text-sm text-[#0F0F0F]/40 dark:text-white/40 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-xl">
                pts
              </span>
            </div>
          </div>

          {/* Direction */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2">
              Direction
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                onClick={() => onLog({ direction: 'BULLISH' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium",
                  todayLog?.direction === 'BULLISH'
                    ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                    : "border-[#8B9A7D]/30 text-[#8B9A7D] hover:bg-[#8B9A7D] hover:text-white"
                )}
              >
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Bullish</span><span className="sm:hidden">Bull</span>
              </button>
              <button
                onClick={() => onLog({ direction: 'BEARISH' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium",
                  todayLog?.direction === 'BEARISH'
                    ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                    : "border-[#C45A3B]/30 text-[#C45A3B] hover:bg-[#C45A3B] hover:text-white"
                )}
              >
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Bearish</span><span className="sm:hidden">Bear</span>
              </button>
              <button
                onClick={() => onLog({ direction: 'CONSOLIDATION' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium",
                  todayLog?.direction === 'CONSOLIDATION'
                    ? "bg-[#0F0F0F]/20 dark:bg-white/20 text-[#0F0F0F] dark:text-white border-[#0F0F0F]/20 dark:border-white/20"
                    : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/50 dark:text-white/50 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Chop
              </button>
            </div>
          </div>

          {/* Displacement Quality */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2">
              Displacement Quality
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                onClick={() => onLog({ displacementQuality: 'CLEAN' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium",
                  todayLog?.displacementQuality === 'CLEAN'
                    ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                    : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
              >
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Low Resistance</span><span className="sm:hidden">Low</span>
              </button>
              <button
                onClick={() => onLog({ displacementQuality: 'CHOPPY' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium",
                  todayLog?.displacementQuality === 'CHOPPY'
                    ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                    : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
              >
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">High Resistance</span><span className="sm:hidden">High</span>
              </button>
            </div>
          </div>

          {/* Liquidity Sweep */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2">
              Liquidity Sweep
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button
                onClick={() => onLog({ liquiditySweep: 'HIGHS' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center text-xs sm:text-sm font-medium",
                  todayLog?.liquiditySweep === 'HIGHS'
                    ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                    : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
              >
                Highs
              </button>
              <button
                onClick={() => onLog({ liquiditySweep: 'LOWS' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center text-xs sm:text-sm font-medium",
                  todayLog?.liquiditySweep === 'LOWS'
                    ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                    : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
              >
                Lows
              </button>
              <button
                onClick={() => onLog({ liquiditySweep: 'BOTH' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center text-xs sm:text-sm font-medium",
                  todayLog?.liquiditySweep === 'BOTH'
                    ? "bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] border-[#0F0F0F] dark:border-white"
                    : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
              >
                Both
              </button>
              <button
                onClick={() => onLog({ liquiditySweep: 'NONE' })}
                className={cn(
                  "h-9 sm:h-10 rounded-xl border transition-colors flex items-center justify-center text-xs sm:text-sm font-medium",
                  todayLog?.liquiditySweep === 'NONE'
                    ? "bg-[#0F0F0F]/20 dark:bg-white/20 text-[#0F0F0F] dark:text-white border-[#0F0F0F]/20 dark:border-white/20"
                    : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
              >
                None
              </button>
            </div>
          </div>

          {/* TradingView Screenshots */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2 flex items-center gap-1.5">
              <LinkIcon className="w-3 h-3" /> Screenshots
            </div>

            {tvLinks.length > 0 && (
              <div className="space-y-2 mb-2">
                {tvLinks.map((link, idx) => {
                  const imageUrl = getTVImageUrl(link);
                  return (
                    <div key={idx} className="flex items-center gap-2 group">
                      {imageUrl ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-[#0F0F0F]/5 dark:bg-white/5 hover:bg-[#0F0F0F]/10 dark:hover:bg-white/10 transition-colors"
                        >
                          <img
                            src={imageUrl}
                            alt={`Chart ${idx + 1}`}
                            className="w-16 h-10 object-cover rounded"
                          />
                          <span className="text-xs text-[#0F0F0F]/60 dark:text-white/60 truncate flex-1">
                            Chart {idx + 1}
                          </span>
                          <ExternalLink className="w-3 h-3 text-[#0F0F0F]/40 dark:text-white/40" />
                        </a>
                      ) : (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs text-[#C45A3B] hover:underline truncate"
                        >
                          {link}
                        </a>
                      )}
                      <button
                        onClick={() => onRemoveTvLink(idx)}
                        className="p-1.5 rounded-lg text-[#0F0F0F]/30 dark:text-white/30 hover:text-[#C45A3B] hover:bg-[#C45A3B]/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {showLinkInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://www.tradingview.com/x/..."
                  className="flex-1 h-9 px-3 text-sm bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#C45A3B] placeholder:text-[#0F0F0F]/30 dark:placeholder:text-white/30 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newLink.trim()) {
                      onAddTvLink(newLink.trim());
                      setNewLink('');
                      setShowLinkInput(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (newLink.trim()) {
                      onAddTvLink(newLink.trim());
                      setNewLink('');
                    }
                    setShowLinkInput(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLinkInput(true)}
                className="w-full h-9 rounded-lg border border-dashed border-[#0F0F0F]/20 dark:border-white/20 text-[#0F0F0F]/40 dark:text-white/40 hover:border-[#0F0F0F]/40 dark:hover:border-white/40 hover:text-[#0F0F0F]/60 dark:hover:text-white/60 transition-colors flex items-center justify-center gap-1.5 text-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Screenshot
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MacrosPage() {
  const router = useRouter();
  const { user, isLoaded } = useEdgeStore();
  const { logs, isLoaded: macrosLoaded, fetchLogs, logMacro, getLogForMacroToday, getTodaysLogs, addTvLink, removeTvLink, showAsiaMacros, setShowAsiaMacros, showLondonMacros, setShowLondonMacros, showNYMacros, setShowNYMacros } = useMacroStore();
  const [showSettings, setShowSettings] = useState(false);

  const exportMacroData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      macroLogs: logs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macro-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const [mounted, setMounted] = useState(false);
  const {
    etHour,
    etMinute,
    etSecond,
    activeMacro,
    nextMacro,
    minutesToNextMacro,
    secondsToNextMacro,
    macroStatuses,
    isTradingHours,
    isWeekend,
    nextTradingDay,
  } = useMacroTime(showAsiaMacros, showLondonMacros, showNYMacros);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (isLoaded && user && !macrosLoaded) {
      fetchLogs();
    }
  }, [isLoaded, user, macrosLoaded, fetchLogs]);

  if (!isLoaded || !user || !mounted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <div className="animate-pulse text-[#0F0F0F]/40 dark:text-white/40">Loading...</div>
      </div>
    );
  }

  const formatCurrentTime = () => {
    const period = etHour >= 12 ? 'PM' : 'AM';
    const displayHour = etHour > 12 ? etHour - 12 : etHour === 0 ? 12 : etHour;
    return `${displayHour}:${etMinute.toString().padStart(2, '0')}:${etSecond.toString().padStart(2, '0')} ${period}`;
  };

  const handleLog = (macroId: string, data: MacroLogInput) => {
    logMacro(macroId, data);
  };

  const todaysLogs = getTodaysLogs();
  const logsWithData = todaysLogs.filter(l => l.direction !== null || l.pointsMoved !== null);
  const loggedCount = logsWithData.length;
  const bullishCount = logsWithData.filter(l => l.direction === 'BULLISH').length;
  const bearishCount = logsWithData.filter(l => l.direction === 'BEARISH').length;
  const consolidationCount = logsWithData.filter(l => l.direction === 'CONSOLIDATION').length;
  const avgPoints = logsWithData.filter(l => l.pointsMoved !== null).length > 0
    ? Math.round(logsWithData.filter(l => l.pointsMoved !== null).reduce((sum, l) => sum + (l.pointsMoved || 0), 0) / logsWithData.filter(l => l.pointsMoved !== null).length)
    : null;

  const upcomingMacros = macroStatuses.filter(s => s.status === 'upcoming');
  const passedMacros = macroStatuses.filter(s => s.status === 'passed');
  const activeMacroStatus = macroStatuses.find(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-[#0F0F0F]/10 dark:border-white/10 bg-[#FAF7F2]/80 dark:bg-[#0F0F0F]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#0F0F0F]/60 dark:text-white/60" />
            </button>
            <div>
              <div className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-0.5">
                Macro Tracker
              </div>
              <h1
                className="text-base sm:text-xl font-medium"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Time Windows
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/macros/stats"
              className="p-1.5 sm:p-2 rounded-full hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors"
              title="View Statistics"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#0F0F0F]/60 dark:text-white/60" />
            </Link>

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-1.5 sm:p-2 rounded-full transition-colors",
                  showSettings ? "bg-[#0F0F0F]/10 dark:bg-white/10" : "hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                )}
                title="Settings"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#0F0F0F]/60 dark:text-white/60" />
              </button>

              {showSettings && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSettings(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl border border-[#0F0F0F]/10 dark:border-white/10 shadow-lg z-50 p-2">
                    <button
                      onClick={() => {
                        exportMacroData();
                        setShowSettings(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
                      Export Logs
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="text-right">
              <div className="text-[10px] sm:text-xs tracking-wider uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-0.5 sm:mb-1">
                <span className="hidden sm:inline">{isTradingHours ? 'Market Open' : 'Market Closed'} • </span>ET
              </div>
              <div
                className="text-lg sm:text-2xl font-mono font-bold tabular-nums text-[#0F0F0F] dark:text-white"
              >
                {formatCurrentTime()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Session Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setShowAsiaMacros(!showAsiaMacros)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              showAsiaMacros
                ? "bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] border-[#0F0F0F] dark:border-white"
                : "bg-transparent text-[#0F0F0F]/60 dark:text-white/60 border-[#0F0F0F]/20 dark:border-white/20 hover:border-[#0F0F0F]/40 dark:hover:border-white/40"
            )}
          >
            Asia
          </button>
          <button
            onClick={() => setShowLondonMacros(!showLondonMacros)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              showLondonMacros
                ? "bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] border-[#0F0F0F] dark:border-white"
                : "bg-transparent text-[#0F0F0F]/60 dark:text-white/60 border-[#0F0F0F]/20 dark:border-white/20 hover:border-[#0F0F0F]/40 dark:hover:border-white/40"
            )}
          >
            London
          </button>
          <button
            onClick={() => setShowNYMacros(!showNYMacros)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              showNYMacros
                ? "bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] border-[#0F0F0F] dark:border-white"
                : "bg-transparent text-[#0F0F0F]/60 dark:text-white/60 border-[#0F0F0F]/20 dark:border-white/20 hover:border-[#0F0F0F]/40 dark:hover:border-white/40"
            )}
          >
            New York
          </button>
        </div>

        {/* Weekend Overlay Banner */}
        {isWeekend && (
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#8B9A7D]/20 to-[#8B9A7D]/5 rounded-3xl blur-xl" />
            <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-sm border-2 border-[#8B9A7D]/30 rounded-3xl p-8 sm:p-10 text-center shadow-lg">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-full bg-[#8B9A7D]/10 flex items-center justify-center">
                <Moon className="w-7 h-7 sm:w-8 sm:h-8 text-[#8B9A7D]" />
              </div>
              <h2
                className="text-2xl sm:text-3xl font-medium text-[#0F0F0F] dark:text-white mb-3"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Markets are closed
              </h2>
              <p className="text-[#0F0F0F]/60 dark:text-white/60 text-sm sm:text-base max-w-md mx-auto mb-4">
                Backtest, journal, review your week, and enjoy your life.
              </p>
              <p
                className="text-[#0F0F0F]/40 dark:text-white/40 text-sm"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}
              >
                See you on {nextTradingDay}.
              </p>
            </div>
          </div>
        )}

        {/* Today's Summary */}
        {!isWeekend && loggedCount > 0 && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-[#0F0F0F]/10 dark:border-white/10">
            <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-2">Today's Summary</div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#0F0F0F] dark:text-white">{loggedCount}</span>
                <span className="text-sm text-[#0F0F0F]/50 dark:text-white/50">logged</span>
              </div>
              {avgPoints !== null && (
                <div className="flex items-center gap-1.5 text-[#0F0F0F] dark:text-white">
                  <Activity className="w-4 h-4 text-[#0F0F0F]/40 dark:text-white/40" />
                  <span className="font-medium">{avgPoints} pts avg</span>
                </div>
              )}
              {bullishCount > 0 && (
                <div className="flex items-center gap-1.5 text-[#8B9A7D]">
                  <ArrowUp className="w-4 h-4" />
                  <span className="font-medium">{bullishCount}</span>
                </div>
              )}
              {bearishCount > 0 && (
                <div className="flex items-center gap-1.5 text-[#C45A3B]">
                  <ArrowDown className="w-4 h-4" />
                  <span className="font-medium">{bearishCount}</span>
                </div>
              )}
              {consolidationCount > 0 && (
                <div className="flex items-center gap-1.5 text-[#0F0F0F]/50 dark:text-white/50">
                  <Minus className="w-4 h-4" />
                  <span className="font-medium">{consolidationCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Macro Hero */}
        {!isWeekend && activeMacroStatus && (
          <div className="mb-8">
            <div className="text-xs tracking-[0.15em] uppercase text-[#C45A3B] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C45A3B] animate-pulse" />
              Active Macro
            </div>
            <MacroCard
              macro={activeMacroStatus.macro}
              status="active"
              minutesUntil={0}
              minutesRemaining={activeMacroStatus.minutesRemaining}
              todayLog={getLogForMacroToday(activeMacroStatus.macro.id)}
              onLog={(data) => handleLog(activeMacroStatus.macro.id, data)}
              onAddTvLink={(link) => addTvLink(activeMacroStatus.macro.id, link)}
              onRemoveTvLink={(idx) => removeTvLink(activeMacroStatus.macro.id, idx)}
            />
          </div>
        )}

        {/* Next Up - Only show countdown when within 60 minutes */}
        {!isWeekend && nextMacro && minutesToNextMacro <= 60 && (
          <div className="mb-8">
            <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-3 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5" />
              Next Macro
            </div>
            <MacroCard
              macro={nextMacro}
              status="upcoming"
              minutesUntil={minutesToNextMacro}
              minutesRemaining={0}
              secondsRemaining={secondsToNextMacro}
              todayLog={getLogForMacroToday(nextMacro.id)}
              onLog={(data) => handleLog(nextMacro.id, data)}
              onAddTvLink={(link) => addTvLink(nextMacro.id, link)}
              onRemoveTvLink={(idx) => removeTvLink(nextMacro.id, idx)}
            />
          </div>
        )}

        {/* Upcoming Macros - Simple list without countdown */}
        {(() => {
          const showNextMacroCountdown = nextMacro && minutesToNextMacro <= 60;
          const laterMacros = upcomingMacros.filter(s =>
            showNextMacroCountdown ? s.macro.id !== nextMacro?.id : true
          );
          return laterMacros.length > 0 && !isWeekend && (
            <div className="mb-8">
              <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-3">
                Later Today ({laterMacros.length})
              </div>
              <div className="space-y-2">
                {laterMacros.map(({ macro }) => (
                  <div
                    key={macro.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-white/[0.03] border border-[#0F0F0F]/10 dark:border-white/10"
                  >
                    <span className="text-sm font-medium text-[#0F0F0F]/70 dark:text-white/70">
                      {macro.name}
                    </span>
                    <span className="text-xs text-[#0F0F0F]/40 dark:text-white/40">
                      {formatMacroTime(macro.startHour, macro.startMinute)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Passed Macros */}
        {!isWeekend && passedMacros.length > 0 && (
          <div>
            <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-3">
              Completed Today ({passedMacros.length})
            </div>
            <div className="space-y-3">
              {passedMacros.slice().reverse().map(({ macro }) => (
                <MacroCard
                  key={macro.id}
                  macro={macro}
                  status="passed"
                  minutesUntil={0}
                  minutesRemaining={0}
                  todayLog={getLogForMacroToday(macro.id)}
                  onLog={(data) => handleLog(macro.id, data)}
                  onAddTvLink={(link) => addTvLink(macro.id, link)}
                  onRemoveTvLink={(idx) => removeTvLink(macro.id, idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Weekend - Faded Read-Only View of All Macros */}
        {isWeekend && macroStatuses.length > 0 && (
          <div className="opacity-40 pointer-events-none select-none">
            <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-3">
              Last Week's Macros (Read Only)
            </div>
            <div className="space-y-3">
              {macroStatuses.map(({ macro }) => (
                <div
                  key={macro.id}
                  className="rounded-2xl border p-4 sm:p-5 bg-[#0F0F0F]/5 dark:bg-white/5 border-[#0F0F0F]/5 dark:border-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="text-base sm:text-lg font-medium text-[#0F0F0F]/40 dark:text-white/40"
                        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                      >
                        {macro.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#0F0F0F]/30 dark:text-white/30 mt-2">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>
                      {formatMacroTime(macro.startHour, macro.startMinute)} — {formatMacroTime(macro.endHour, macro.endMinute)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - No sessions selected */}
        {!isWeekend && macroStatuses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0F0F0F]/5 dark:bg-white/5 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#0F0F0F]/30 dark:text-white/30" />
            </div>
            <h3
              className="text-lg font-medium text-[#0F0F0F]/60 dark:text-white/60 mb-2"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              No sessions selected
            </h3>
            <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm">
              Select a session to log your macros
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
