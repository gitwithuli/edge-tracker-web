"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMacroTime } from "@/hooks/use-macro-time";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { formatMacroTime, MacroWindow, MACRO_OUTCOMES } from "@/lib/macro-constants";
import { Clock, Timer, TrendingUp, TrendingDown, Minus, XCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function MacroCard({
  macro,
  status,
  minutesUntil,
  minutesRemaining,
  secondsRemaining,
}: {
  macro: MacroWindow;
  status: 'upcoming' | 'active' | 'passed';
  minutesUntil: number;
  minutesRemaining: number;
  secondsRemaining?: number;
}) {
  const isRTH = macro.category === 'rth_close';

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all duration-500",
        status === 'active'
          ? "bg-[#C45A3B]/10 border-[#C45A3B] shadow-lg shadow-[#C45A3B]/10"
          : status === 'upcoming'
            ? "bg-white/50 border-[#0F0F0F]/10 hover:border-[#0F0F0F]/20"
            : "bg-[#0F0F0F]/5 border-[#0F0F0F]/5 opacity-60"
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
          </div>
          <h3
            className={cn(
              "text-lg font-medium",
              status === 'passed' ? "text-[#0F0F0F]/40" : "text-[#0F0F0F]"
            )}
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {macro.name}
          </h3>
        </div>

        <div className={cn(
          "text-right",
          status === 'active' ? "text-[#C45A3B]" : "text-[#0F0F0F]/40"
        )}>
          <div className="text-xs uppercase tracking-wider mb-1">
            {status === 'active' ? 'Remaining' : status === 'upcoming' ? 'Starts in' : 'Ended'}
          </div>
          {status !== 'passed' && (
            <div className="text-2xl font-mono font-bold tabular-nums">
              {status === 'active'
                ? `${minutesRemaining}m`
                : `${minutesUntil}m ${secondsRemaining !== undefined ? `${secondsRemaining}s` : ''}`
              }
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-[#0F0F0F]/50">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {formatMacroTime(macro.startHour, macro.startMinute)} — {formatMacroTime(macro.endHour, macro.endMinute)}
        </span>
      </div>

      {status === 'active' && (
        <div className="mt-4 pt-4 border-t border-[#C45A3B]/20">
          <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Log Outcome</div>
          <div className="grid grid-cols-4 gap-2">
            <button className="h-10 rounded-xl border border-[#8B9A7D]/30 text-[#8B9A7D] hover:bg-[#8B9A7D] hover:text-white transition-colors flex items-center justify-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4" /> Win
            </button>
            <button className="h-10 rounded-xl border border-[#C45A3B]/30 text-[#C45A3B] hover:bg-[#C45A3B] hover:text-white transition-colors flex items-center justify-center gap-1.5 text-sm font-medium">
              <TrendingDown className="w-4 h-4" /> Loss
            </button>
            <button className="h-10 rounded-xl border border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:bg-[#0F0F0F]/5 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium">
              <Minus className="w-4 h-4" /> BE
            </button>
            <button className="h-10 rounded-xl border border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:bg-[#0F0F0F]/5 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium">
              <XCircle className="w-4 h-4" /> Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MacrosPage() {
  const router = useRouter();
  const { user, isLoaded } = useEdgeStore();
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
  } = useMacroTime();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user || !mounted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-pulse text-[#0F0F0F]/40">Loading...</div>
      </div>
    );
  }

  const formatCurrentTime = () => {
    const period = etHour >= 12 ? 'PM' : 'AM';
    const displayHour = etHour > 12 ? etHour - 12 : etHour === 0 ? 12 : etHour;
    return `${displayHour}:${etMinute.toString().padStart(2, '0')}:${etSecond.toString().padStart(2, '0')} ${period}`;
  };

  const upcomingMacros = macroStatuses.filter(s => s.status === 'upcoming');
  const passedMacros = macroStatuses.filter(s => s.status === 'passed');
  const activeMacroStatus = macroStatuses.find(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0F0F0F]">
      {/* Header */}
      <header className="border-b border-[#0F0F0F]/10 bg-[#FAF7F2]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 -ml-2 rounded-full hover:bg-[#0F0F0F]/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#0F0F0F]/60" />
            </button>
            <div>
              <div className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 mb-0.5">
                Macro Tracker
              </div>
              <h1
                className="text-xl font-medium"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Time Windows
              </h1>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs tracking-wider uppercase text-[#0F0F0F]/40 mb-1">
              {isTradingHours ? 'Market Open' : 'Market Closed'} • ET
            </div>
            <div
              className="text-2xl font-mono font-bold tabular-nums text-[#0F0F0F]"
            >
              {formatCurrentTime()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Active Macro Hero */}
        {activeMacroStatus && (
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
            />
          </div>
        )}

        {/* Next Up */}
        {nextMacro && !activeMacroStatus && (
          <div className="mb-8">
            <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 mb-3 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5" />
              Next Macro
            </div>
            <MacroCard
              macro={nextMacro}
              status="upcoming"
              minutesUntil={minutesToNextMacro}
              minutesRemaining={0}
              secondsRemaining={secondsToNextMacro}
            />
          </div>
        )}

        {/* Upcoming Macros */}
        {upcomingMacros.length > (activeMacroStatus ? 0 : 1) && (
          <div className="mb-8">
            <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 mb-3">
              Upcoming ({upcomingMacros.length - (activeMacroStatus ? 0 : 1)} remaining)
            </div>
            <div className="space-y-3">
              {upcomingMacros
                .filter(s => s.macro.id !== nextMacro?.id || activeMacroStatus)
                .map(({ macro, minutesUntil }) => (
                  <MacroCard
                    key={macro.id}
                    macro={macro}
                    status="upcoming"
                    minutesUntil={minutesUntil}
                    minutesRemaining={0}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Passed Macros */}
        {passedMacros.length > 0 && (
          <div>
            <div className="text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/40 mb-3">
              Completed Today ({passedMacros.length})
            </div>
            <div className="space-y-3">
              {passedMacros.map(({ macro }) => (
                <MacroCard
                  key={macro.id}
                  macro={macro}
                  status="passed"
                  minutesUntil={0}
                  minutesRemaining={0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {macroStatuses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0F0F0F]/5 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#0F0F0F]/30" />
            </div>
            <p
              className="text-[#0F0F0F]/40 text-sm"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}
            >
              No macros scheduled for today
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
