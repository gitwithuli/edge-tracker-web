"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMacroStore, MacroLog, MacroDirection, MacroLogInput, DisplacementQuality, LiquiditySweep } from "@/hooks/use-macro-store";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { ALL_MACROS, getMacrosForDisplay, MacroCategory } from "@/lib/macro-constants";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Calendar,
  BarChart3,
  X,
  Trash2,
  Pencil,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function MacroEntryCard({
  log,
  onUpdate,
  onDelete,
}: {
  log: MacroLog;
  onUpdate: (logId: string, updates: Partial<MacroLogInput>) => void;
  onDelete: (logId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    pointsMoved: log.pointsMoved,
    direction: log.direction,
    displacementQuality: log.displacementQuality,
    liquiditySweep: log.liquiditySweep,
  });

  const macro = ALL_MACROS.find(m => m.id === log.macroId);

  const categoryLabels: Record<MacroCategory, string> = {
    overnight: 'Overnight',
    london: 'London',
    rth: 'RTH',
    rth_close: 'RTH Close',
    asia: 'Asia',
  };

  const directionStyles: Record<MacroDirection, { bg: string; text: string; icon: React.ReactNode }> = {
    BULLISH: { bg: "bg-[#8B9A7D]", text: "text-white", icon: <ArrowUp className="w-3 h-3" /> },
    BEARISH: { bg: "bg-[#C45A3B]", text: "text-white", icon: <ArrowDown className="w-3 h-3" /> },
    CONSOLIDATION: { bg: "bg-[#0F0F0F]/20", text: "text-[#0F0F0F]", icon: <Minus className="w-3 h-3" /> },
  };

  const dirStyle = log.direction ? directionStyles[log.direction] : null;

  const handleSave = () => {
    onUpdate(log.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      pointsMoved: log.pointsMoved,
      direction: log.direction,
      displacementQuality: log.displacementQuality,
      liquiditySweep: log.liquiditySweep,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl bg-white border-2 border-[#C45A3B]/30">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-[#0F0F0F]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            {macro?.name || log.macroId}
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-[#0F0F0F]/5 transition-colors text-[#0F0F0F]/40"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="p-1.5 rounded-lg bg-[#8B9A7D] text-white hover:bg-[#8B9A7D]/80 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Points */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Points Moved</div>
            <input
              type="number"
              value={editData.pointsMoved ?? ''}
              onChange={(e) => setEditData({ ...editData, pointsMoved: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="e.g. 15"
              className="w-full h-9 px-3 text-sm bg-[#FAF7F2] border border-[#0F0F0F]/10 rounded-lg focus:outline-none focus:border-[#C45A3B]"
            />
          </div>

          {/* Direction */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Direction</div>
            <div className="grid grid-cols-3 gap-2">
              {(['BULLISH', 'BEARISH', 'CONSOLIDATION'] as MacroDirection[]).map(dir => (
                <button
                  key={dir}
                  onClick={() => setEditData({ ...editData, direction: dir })}
                  className={cn(
                    "h-9 rounded-lg border text-xs font-medium transition-colors",
                    editData.direction === dir
                      ? dir === 'BULLISH' ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                        : dir === 'BEARISH' ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                        : "bg-[#0F0F0F]/20 text-[#0F0F0F] border-[#0F0F0F]/20"
                      : "border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:bg-[#0F0F0F]/5"
                  )}
                >
                  {dir === 'CONSOLIDATION' ? 'Chop' : dir.charAt(0) + dir.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Displacement */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Resistance</div>
            <div className="grid grid-cols-2 gap-2">
              {(['CLEAN', 'CHOPPY'] as DisplacementQuality[]).map(qual => (
                <button
                  key={qual}
                  onClick={() => setEditData({ ...editData, displacementQuality: qual })}
                  className={cn(
                    "h-9 rounded-lg border text-xs font-medium transition-colors",
                    editData.displacementQuality === qual
                      ? qual === 'CLEAN' ? "bg-[#8B9A7D] text-white border-[#8B9A7D]" : "bg-[#C45A3B] text-white border-[#C45A3B]"
                      : "border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:bg-[#0F0F0F]/5"
                  )}
                >
                  {qual === 'CLEAN' ? 'Low' : 'High'}
                </button>
              ))}
            </div>
          </div>

          {/* Liquidity */}
          <div>
            <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Liquidity Sweep</div>
            <div className="grid grid-cols-4 gap-2">
              {(['HIGHS', 'LOWS', 'BOTH', 'NONE'] as LiquiditySweep[]).map(liq => (
                <button
                  key={liq}
                  onClick={() => setEditData({ ...editData, liquiditySweep: liq })}
                  className={cn(
                    "h-9 rounded-lg border text-xs font-medium transition-colors",
                    editData.liquiditySweep === liq
                      ? liq === 'HIGHS' ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                        : liq === 'LOWS' ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                        : liq === 'BOTH' ? "bg-[#0F0F0F] text-white border-[#0F0F0F]"
                        : "bg-[#0F0F0F]/20 text-[#0F0F0F] border-[#0F0F0F]/20"
                      : "border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:bg-[#0F0F0F]/5"
                  )}
                >
                  {liq.charAt(0) + liq.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white border border-[#0F0F0F]/10 group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-[#0F0F0F]/40 uppercase tracking-wider mb-1">
            {macro ? categoryLabels[macro.category] : 'Macro'}
          </div>
          <h4 className="font-medium text-[#0F0F0F]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            {macro?.name || log.macroId}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {dirStyle && (
            <span className={cn(
              "text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wider flex items-center gap-1",
              dirStyle.bg,
              dirStyle.text
            )}>
              {dirStyle.icon}
              {log.direction}
            </span>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg hover:bg-[#0F0F0F]/5 transition-colors text-[#0F0F0F]/40 hover:text-[#0F0F0F]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-1.5 rounded-lg hover:bg-[#C45A3B]/10 transition-colors text-[#0F0F0F]/40 hover:text-[#C45A3B]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF7F2] border-[#0F0F0F]/10">
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                    Delete macro log?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#0F0F0F]/60">
                    This will permanently delete this macro entry. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full border-[#0F0F0F]/10 hover:bg-[#0F0F0F]/5">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(log.id)}
                    className="rounded-full bg-[#C45A3B] hover:bg-[#C45A3B]/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {log.pointsMoved !== null && (
          <div>
            <div className="text-[#0F0F0F]/40 text-xs mb-0.5">Points</div>
            <div className="font-medium">{log.pointsMoved} pts</div>
          </div>
        )}
        {log.displacementQuality && (
          <div>
            <div className="text-[#0F0F0F]/40 text-xs mb-0.5">Resistance</div>
            <div className="font-medium">{log.displacementQuality === 'CLEAN' ? 'Low' : 'High'}</div>
          </div>
        )}
        {log.liquiditySweep && (
          <div>
            <div className="text-[#0F0F0F]/40 text-xs mb-0.5">Liquidity</div>
            <div className="font-medium capitalize">{log.liquiditySweep.toLowerCase()}</div>
          </div>
        )}
      </div>

      {log.tvLinks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#0F0F0F]/5">
          <div className="text-xs text-[#0F0F0F]/40 mb-1">{log.tvLinks.length} screenshot{log.tvLinks.length > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

function AddEntryForm({
  date,
  existingMacroIds,
  onAdd,
  onCancel,
  showAsiaMacros,
}: {
  date: string;
  existingMacroIds: string[];
  onAdd: (macroId: string, data: MacroLogInput) => void;
  onCancel: () => void;
  showAsiaMacros: boolean;
}) {
  const [selectedMacro, setSelectedMacro] = useState<string>('');
  const [formData, setFormData] = useState<MacroLogInput>({
    pointsMoved: null,
    direction: null,
    displacementQuality: null,
    liquiditySweep: null,
  });

  const macroList = getMacrosForDisplay(showAsiaMacros);
  const availableMacros = macroList.filter(m => !existingMacroIds.includes(m.id));

  const handleSubmit = () => {
    if (!selectedMacro) return;
    onAdd(selectedMacro, formData);
  };

  return (
    <div className="p-4 rounded-xl bg-[#FAF7F2] border-2 border-dashed border-[#0F0F0F]/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-[#0F0F0F]">Add New Entry</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-[#0F0F0F]/5 transition-colors text-[#0F0F0F]/40"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMacro}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              selectedMacro
                ? "bg-[#8B9A7D] text-white hover:bg-[#8B9A7D]/80"
                : "bg-[#0F0F0F]/10 text-[#0F0F0F]/30 cursor-not-allowed"
            )}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Macro Select */}
        <div>
          <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Macro Window</div>
          {availableMacros.length > 0 ? (
            <select
              value={selectedMacro}
              onChange={(e) => setSelectedMacro(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-white border border-[#0F0F0F]/10 rounded-lg focus:outline-none focus:border-[#C45A3B]"
            >
              <option value="">Select a macro...</option>
              {availableMacros.map(macro => (
                <option key={macro.id} value={macro.id}>
                  {macro.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-[#0F0F0F]/40 italic">All macros already logged for this day</div>
          )}
        </div>

        {selectedMacro && (
          <>
            {/* Points */}
            <div>
              <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Points Moved</div>
              <input
                type="number"
                value={formData.pointsMoved ?? ''}
                onChange={(e) => setFormData({ ...formData, pointsMoved: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="e.g. 15"
                className="w-full h-9 px-3 text-sm bg-white border border-[#0F0F0F]/10 rounded-lg focus:outline-none focus:border-[#C45A3B]"
              />
            </div>

            {/* Direction */}
            <div>
              <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Direction</div>
              <div className="grid grid-cols-3 gap-2">
                {(['BULLISH', 'BEARISH', 'CONSOLIDATION'] as MacroDirection[]).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setFormData({ ...formData, direction: dir })}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-medium transition-colors",
                      formData.direction === dir
                        ? dir === 'BULLISH' ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                          : dir === 'BEARISH' ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                          : "bg-[#0F0F0F]/20 text-[#0F0F0F] border-[#0F0F0F]/20"
                        : "border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:bg-[#0F0F0F]/5"
                    )}
                  >
                    {dir === 'CONSOLIDATION' ? 'Chop' : dir.charAt(0) + dir.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Displacement */}
            <div>
              <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Resistance</div>
              <div className="grid grid-cols-2 gap-2">
                {(['CLEAN', 'CHOPPY'] as DisplacementQuality[]).map(qual => (
                  <button
                    key={qual}
                    onClick={() => setFormData({ ...formData, displacementQuality: qual })}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-medium transition-colors",
                      formData.displacementQuality === qual
                        ? qual === 'CLEAN' ? "bg-[#8B9A7D] text-white border-[#8B9A7D]" : "bg-[#C45A3B] text-white border-[#C45A3B]"
                        : "border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:bg-[#0F0F0F]/5"
                    )}
                  >
                    {qual === 'CLEAN' ? 'Low' : 'High'}
                  </button>
                ))}
              </div>
            </div>

            {/* Liquidity */}
            <div>
              <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/40 mb-2">Liquidity Sweep</div>
              <div className="grid grid-cols-4 gap-2">
                {(['HIGHS', 'LOWS', 'BOTH', 'NONE'] as LiquiditySweep[]).map(liq => (
                  <button
                    key={liq}
                    onClick={() => setFormData({ ...formData, liquiditySweep: liq })}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-medium transition-colors",
                      formData.liquiditySweep === liq
                        ? liq === 'HIGHS' ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                          : liq === 'LOWS' ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                          : liq === 'BOTH' ? "bg-[#0F0F0F] text-white border-[#0F0F0F]"
                          : "bg-[#0F0F0F]/20 text-[#0F0F0F] border-[#0F0F0F]/20"
                        : "border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:bg-[#0F0F0F]/5"
                    )}
                  >
                    {liq.charAt(0) + liq.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MacroStatsPage() {
  const router = useRouter();
  const { user, isLoaded } = useEdgeStore();
  const { logs, updateLog, deleteLog, logMacroForDate, showAsiaMacros } = useMacroStore();
  const [mounted, setMounted] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // Calendar state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login");
    }
  }, [isLoaded, user, router]);

  // Group logs by date
  const logsByDate = useMemo(() => {
    const grouped: Record<string, MacroLog[]> = {};
    logs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    });
    return grouped;
  }, [logs]);

  // Calculate stats
  const stats = useMemo(() => {
    const logsWithData = logs.filter(l => l.direction !== null || l.pointsMoved !== null);

    const totalLogs = logsWithData.length;
    const bullishCount = logsWithData.filter(l => l.direction === 'BULLISH').length;
    const bearishCount = logsWithData.filter(l => l.direction === 'BEARISH').length;
    const consolidationCount = logsWithData.filter(l => l.direction === 'CONSOLIDATION').length;

    const logsWithPoints = logsWithData.filter(l => l.pointsMoved !== null);
    const avgPoints = logsWithPoints.length > 0
      ? Math.round(logsWithPoints.reduce((sum, l) => sum + (l.pointsMoved || 0), 0) / logsWithPoints.length)
      : 0;

    const lowResistanceCount = logsWithData.filter(l => l.displacementQuality === 'CLEAN').length;
    const highResistanceCount = logsWithData.filter(l => l.displacementQuality === 'CHOPPY').length;

    // Best macro by avg points
    const macroStats: Record<string, { total: number; count: number }> = {};
    logsWithPoints.forEach(log => {
      if (!macroStats[log.macroId]) {
        macroStats[log.macroId] = { total: 0, count: 0 };
      }
      macroStats[log.macroId].total += log.pointsMoved || 0;
      macroStats[log.macroId].count += 1;
    });

    let bestMacro = { id: '', avg: 0, name: '' };
    Object.entries(macroStats).forEach(([id, { total, count }]) => {
      const avg = Math.round(total / count);
      if (avg > bestMacro.avg) {
        const macro = ALL_MACROS.find(m => m.id === id);
        bestMacro = { id, avg, name: macro?.name || id };
      }
    });

    // Day of week analysis (parse as local time to avoid timezone shifts)
    const dayStats: Record<number, { bullish: number; bearish: number; total: number }> = {};
    logsWithData.forEach(log => {
      const day = new Date(log.date + 'T12:00:00').getDay();
      if (!dayStats[day]) {
        dayStats[day] = { bullish: 0, bearish: 0, total: 0 };
      }
      dayStats[day].total += 1;
      if (log.direction === 'BULLISH') dayStats[day].bullish += 1;
      if (log.direction === 'BEARISH') dayStats[day].bearish += 1;
    });

    let bestDay = { day: -1, score: 0 };
    Object.entries(dayStats).forEach(([day, { bullish, bearish, total }]) => {
      const directionalRate = total > 0 ? ((bullish + bearish) / total) * 100 : 0;
      if (directionalRate > bestDay.score && total >= 3) {
        bestDay = { day: parseInt(day), score: directionalRate };
      }
    });

    return {
      totalLogs,
      bullishCount,
      bearishCount,
      consolidationCount,
      avgPoints,
      lowResistanceCount,
      highResistanceCount,
      bestMacro,
      bestDay: bestDay.day >= 0 ? DAYS_OF_WEEK[bestDay.day] : null,
      bullishRate: totalLogs > 0 ? Math.round((bullishCount / totalLogs) * 100) : 0,
      bearishRate: totalLogs > 0 ? Math.round((bearishCount / totalLogs) * 100) : 0,
    };
  }, [logs]);

  const calendarDays = useMemo(() => {
    return getCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const selectedDateLogs = selectedDate ? logsByDate[selectedDate] || [] : [];

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(formatDateKey(today));
  };

  if (!isLoaded || !user || !mounted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-pulse text-[#0F0F0F]/40">Loading...</div>
      </div>
    );
  }

  const isToday = (date: Date) => {
    return formatDateKey(date) === formatDateKey(today);
  };

  const getDayIndicators = (date: Date) => {
    const dateKey = formatDateKey(date);
    const dayLogs = logsByDate[dateKey] || [];
    if (dayLogs.length === 0) return null;

    const directions = dayLogs.map(l => l.direction).filter(Boolean);
    const bullish = directions.filter(d => d === 'BULLISH').length;
    const bearish = directions.filter(d => d === 'BEARISH').length;

    return { count: dayLogs.length, bullish, bearish };
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0F0F0F]">
      {/* Header */}
      <header className="border-b border-[#0F0F0F]/10 bg-[#FAF7F2]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/macros')}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-[#0F0F0F]/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#0F0F0F]/60" />
            </button>
            <div>
              <div className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 mb-0.5">
                Macro Tracker
              </div>
              <h1
                className="text-base sm:text-xl font-medium"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Statistics
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Overview */}
        <section className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F0F0F]/40" />
            <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40">Overview</span>
            <div className="flex-1 h-px bg-[#0F0F0F]/10" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10">
              <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40 uppercase tracking-wider mb-1">Total Logged</div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0F0F0F]">{stats.totalLogs}</div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10">
              <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40 uppercase tracking-wider mb-1">Avg Points</div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0F0F0F]">{stats.avgPoints}</div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10">
              <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40 uppercase tracking-wider mb-1">Best Macro</div>
              <div className="text-base sm:text-xl font-bold text-[#0F0F0F] truncate">{stats.bestMacro.name || '—'}</div>
              {stats.bestMacro.avg > 0 && (
                <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40">{stats.bestMacro.avg} pts avg</div>
              )}
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10">
              <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40 uppercase tracking-wider mb-1">Best Day</div>
              <div className="text-base sm:text-xl font-bold text-[#0F0F0F]">{stats.bestDay || '—'}</div>
              <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40">Most directional</div>
            </div>
          </div>

          {/* Direction & Resistance Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10">
              <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40 uppercase tracking-wider mb-2 sm:mb-3">Direction Breakdown</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[#8B9A7D] w-16 sm:w-24">
                    <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Bullish</span>
                  </div>
                  <div className="flex-1 h-1.5 sm:h-2 bg-[#0F0F0F]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B9A7D] rounded-full transition-all"
                      style={{ width: `${stats.bullishRate}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium w-10 sm:w-12 text-right">{stats.bullishRate}%</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[#C45A3B] w-16 sm:w-24">
                    <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Bearish</span>
                  </div>
                  <div className="flex-1 h-1.5 sm:h-2 bg-[#0F0F0F]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C45A3B] rounded-full transition-all"
                      style={{ width: `${stats.bearishRate}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium w-10 sm:w-12 text-right">{stats.bearishRate}%</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[#0F0F0F]/50 w-16 sm:w-24">
                    <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Chop</span>
                  </div>
                  <div className="flex-1 h-1.5 sm:h-2 bg-[#0F0F0F]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F0F0F]/20 rounded-full transition-all"
                      style={{ width: `${100 - stats.bullishRate - stats.bearishRate}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium w-10 sm:w-12 text-right">{100 - stats.bullishRate - stats.bearishRate}%</span>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10">
              <div className="text-[10px] sm:text-xs text-[#0F0F0F]/40 uppercase tracking-wider mb-2 sm:mb-3">Resistance Breakdown</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[#8B9A7D] w-16 sm:w-24">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Low</span>
                  </div>
                  <div className="flex-1 h-1.5 sm:h-2 bg-[#0F0F0F]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B9A7D] rounded-full transition-all"
                      style={{ width: `${stats.totalLogs > 0 ? Math.round((stats.lowResistanceCount / (stats.lowResistanceCount + stats.highResistanceCount || 1)) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium w-10 sm:w-12 text-right">{stats.lowResistanceCount}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[#C45A3B] w-16 sm:w-24">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">High</span>
                  </div>
                  <div className="flex-1 h-1.5 sm:h-2 bg-[#0F0F0F]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C45A3B] rounded-full transition-all"
                      style={{ width: `${stats.totalLogs > 0 ? Math.round((stats.highResistanceCount / (stats.lowResistanceCount + stats.highResistanceCount || 1)) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium w-10 sm:w-12 text-right">{stats.highResistanceCount}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calendar Section */}
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F0F0F]/40" />
            <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40">Calendar</span>
            <div className="flex-1 h-px bg-[#0F0F0F]/10" />
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-[#0F0F0F]/10">
              <h3 className="text-sm sm:text-base font-medium" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={goToPrevMonth}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[#0F0F0F]/5 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg hover:bg-[#0F0F0F]/5 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[#0F0F0F]/5 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-1.5 sm:p-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-0.5 sm:mb-1">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-[10px] sm:text-xs text-[#0F0F0F]/40 font-medium py-1 sm:py-2">
                    {day.slice(0, 1)}
                    <span className="hidden sm:inline">{day.slice(1)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                  const dateKey = formatDateKey(date);
                  const indicators = getDayIndicators(date);
                  const isSelected = selectedDate === dateKey;
                  const isTodayDate = isToday(date);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(dateKey)}
                      className={cn(
                        "relative aspect-square p-0.5 sm:p-1 rounded-lg sm:rounded-xl transition-all flex flex-col items-center justify-start",
                        isCurrentMonth ? "text-[#0F0F0F]" : "text-[#0F0F0F]/30",
                        isSelected && "bg-[#0F0F0F] text-white",
                        !isSelected && isTodayDate && "bg-[#C45A3B]/10",
                        !isSelected && "hover:bg-[#0F0F0F]/5"
                      )}
                    >
                      <span className={cn(
                        "text-xs sm:text-sm font-medium",
                        isTodayDate && !isSelected && "text-[#C45A3B]"
                      )}>
                        {date.getDate()}
                      </span>

                      {/* Indicators */}
                      {indicators && (
                        <div className="flex gap-0.5 mt-0.5 sm:mt-1">
                          {indicators.bullish > 0 && (
                            <div className={cn(
                              "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full",
                              isSelected ? "bg-[#8B9A7D]" : "bg-[#8B9A7D]"
                            )} />
                          )}
                          {indicators.bearish > 0 && (
                            <div className={cn(
                              "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full",
                              isSelected ? "bg-[#C45A3B]" : "bg-[#C45A3B]"
                            )} />
                          )}
                          {indicators.count > indicators.bullish + indicators.bearish && (
                            <div className={cn(
                              "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full",
                              isSelected ? "bg-white/50" : "bg-[#0F0F0F]/20"
                            )} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Day Panel */}
          {selectedDate && (
            <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-[#0F0F0F]/10">
                <h4 className="text-sm sm:text-base font-medium">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h4>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {!isAddingEntry && (
                    <button
                      onClick={() => setIsAddingEntry(true)}
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#0F0F0F] text-white text-xs sm:text-sm font-medium hover:bg-[#C45A3B] transition-colors"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Add
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setIsAddingEntry(false);
                    }}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-[#0F0F0F]/5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {isAddingEntry && (
                  <AddEntryForm
                    date={selectedDate}
                    existingMacroIds={selectedDateLogs.map(l => l.macroId)}
                    onAdd={(macroId, data) => {
                      logMacroForDate(macroId, selectedDate, data);
                      setIsAddingEntry(false);
                    }}
                    onCancel={() => setIsAddingEntry(false)}
                    showAsiaMacros={showAsiaMacros}
                  />
                )}

                {selectedDateLogs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateLogs.map(log => (
                      <MacroEntryCard
                        key={log.id}
                        log={log}
                        onUpdate={updateLog}
                        onDelete={deleteLog}
                      />
                    ))}
                  </div>
                ) : !isAddingEntry ? (
                  <div className="text-center py-8 text-[#0F0F0F]/40">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No macros logged on this day</p>
                    <button
                      onClick={() => setIsAddingEntry(true)}
                      className="mt-3 text-sm text-[#C45A3B] hover:underline"
                    >
                      Add an entry
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
