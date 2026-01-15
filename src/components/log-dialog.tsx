"use client";

import { memo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Link as LinkIcon, Loader2, Check, X, Calendar as CalendarIcon, Clock, Rewind, Play, TrendingUp, TrendingDown, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import type { TradeLog, TradeLogInput, ResultType, TradingDay, LogType, OutcomeType, DirectionType } from "@/lib/types";
import { RESULT_TYPES, TRADING_DAYS, LOG_TYPES, DEFAULT_LOG_VALUES, OUTCOME_TYPES, DIRECTION_TYPES, FUTURES_SYMBOLS, type FuturesSymbol } from "@/lib/constants";
import { useEdgeStore } from "@/hooks/use-edge-store";
import type { OptionalFieldGroup } from "@/lib/schemas";

interface LogDialogProps {
  edgeName?: string;
  edgeId?: string;
  initialData?: TradeLog;
  trigger?: React.ReactNode;
  defaultLogType?: LogType;
  onSave: (data: TradeLogInput, newEdgeId?: string) => void;
}

export const LogDialog = memo(function LogDialog({ edgeName, edgeId, initialData, trigger, defaultLogType, onSave }: LogDialogProps) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { loadingStates, edges } = useEdgeStore();
  const isLoading = loadingStates.addingLog || loadingStates.updatingLogId !== null;
  const isEditing = !!initialData;

  const [result, setResult] = useState<ResultType>(initialData?.result as ResultType || DEFAULT_LOG_VALUES.result);
  const [outcome, setOutcome] = useState<OutcomeType | null>(initialData?.outcome as OutcomeType || null);
  const [logType, setLogType] = useState<LogType>(initialData?.logType as LogType || defaultLogType || DEFAULT_LOG_VALUES.logType);
  const [day, setDay] = useState<TradingDay>(initialData?.dayOfWeek as TradingDay || DEFAULT_LOG_VALUES.dayOfWeek);
  const [duration, setDuration] = useState(initialData?.durationMinutes?.toString() || DEFAULT_LOG_VALUES.durationMinutes.toString());
  const [note, setNote] = useState(initialData?.note || DEFAULT_LOG_VALUES.note);
  const [tvLinks, setTvLinks] = useState<string[]>(initialData?.tvLinks || []);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>(initialData?.edgeId || edgeId || '');
  const [showOutcomeError, setShowOutcomeError] = useState(false);

  // Optional field states
  const [entryPrice, setEntryPrice] = useState<string>(initialData?.entryPrice?.toString() || '');
  const [exitPrice, setExitPrice] = useState<string>(initialData?.exitPrice?.toString() || '');
  const [entryTime, setEntryTime] = useState<string>(initialData?.entryTime || '');
  const [exitTime, setExitTime] = useState<string>(initialData?.exitTime || '');
  const [dailyOpen, setDailyOpen] = useState<string>(initialData?.dailyOpen?.toString() || '');
  const [dailyHigh, setDailyHigh] = useState<string>(initialData?.dailyHigh?.toString() || '');
  const [dailyLow, setDailyLow] = useState<string>(initialData?.dailyLow?.toString() || '');
  const [dailyClose, setDailyClose] = useState<string>(initialData?.dailyClose?.toString() || '');
  const [nyOpen, setNyOpen] = useState<string>(initialData?.nyOpen?.toString() || '');
  const [positionSize, setPositionSize] = useState<string>(initialData?.positionSize?.toString() || '');
  const [direction, setDirection] = useState<DirectionType | null>(initialData?.direction as DirectionType || null);
  const [symbol, setSymbol] = useState<FuturesSymbol | null>((initialData?.symbol as FuturesSymbol) || null);

  // Get enabled fields for current edge
  const currentEdge = edges.find(e => e.id === (selectedEdgeId || edgeId));
  const enabledFields: OptionalFieldGroup[] = currentEdge?.enabledFields || [];
  const hasPriceTracking = enabledFields.includes('entryExitPrices');

  const selectedDate = date ? new Date(date + 'T12:00:00') : undefined;

  // Auto-detect day of week when date changes
  useEffect(() => {
    if (date) {
      const dateObj = new Date(date + 'T12:00:00');
      const dayNames: TradingDay[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as TradingDay[];
      const dayName = dayNames[dateObj.getDay()];
      if (TRADING_DAYS.includes(dayName as TradingDay)) {
        setDay(dayName as TradingDay);
      }
    }
  }, [date]);

  useEffect(() => {
    if (open) {
      setShowOutcomeError(false);
      if (initialData) {
        setResult(initialData.result as ResultType);
        setOutcome(initialData.outcome as OutcomeType || null);
        setLogType(initialData.logType as LogType || defaultLogType || 'FRONTTEST');
        setDay(initialData.dayOfWeek as TradingDay);
        setDuration(initialData.durationMinutes?.toString() || "15");
        setNote(initialData.note || "");
        setTvLinks(initialData.tvLinks || []);
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setSelectedEdgeId(initialData.edgeId);
        // Optional fields
        setEntryPrice(initialData.entryPrice?.toString() || '');
        setExitPrice(initialData.exitPrice?.toString() || '');
        setEntryTime(initialData.entryTime || '');
        setExitTime(initialData.exitTime || '');
        setDailyOpen(initialData.dailyOpen?.toString() || '');
        setDailyHigh(initialData.dailyHigh?.toString() || '');
        setDailyLow(initialData.dailyLow?.toString() || '');
        setDailyClose(initialData.dailyClose?.toString() || '');
        setNyOpen(initialData.nyOpen?.toString() || '');
        setPositionSize(initialData.positionSize?.toString() || '');
        setDirection(initialData.direction as DirectionType || null);
        setSymbol((initialData.symbol as FuturesSymbol) || null);
      } else {
        setResult(DEFAULT_LOG_VALUES.result);
        setOutcome(null);
        setLogType(defaultLogType || DEFAULT_LOG_VALUES.logType);
        setDuration(DEFAULT_LOG_VALUES.durationMinutes.toString());
        setNote(DEFAULT_LOG_VALUES.note);
        setTvLinks([]);
        setDate(new Date().toISOString().split('T')[0]);
        setSelectedEdgeId(edgeId || edges[0]?.id || '');
        // Reset optional fields
        setEntryPrice('');
        setExitPrice('');
        setEntryTime('');
        setExitTime('');
        setDailyOpen('');
        setDailyHigh('');
        setDailyLow('');
        setDailyClose('');
        setNyOpen('');
        setPositionSize('');
        setDirection(null);
        setSymbol(null);
        // Auto-detect today's day
        const days: TradingDay[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as TradingDay[];
        const today = days[new Date().getDay()];
        if (TRADING_DAYS.includes(today as TradingDay)) {
          setDay(today as TradingDay);
        }
      }
    }
  }, [open, initialData, defaultLogType, edgeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const durationNum = result === "NO_SETUP" ? 0 : (parseInt(duration) || 0);
    if (result === "OCCURRED" && durationNum < 1) return;

    // Validation depends on whether price tracking is enabled
    if (result === "OCCURRED") {
      if (hasPriceTracking) {
        // Need direction when price tracking enabled
        if (!direction) {
          setShowOutcomeError(true);
          return;
        }
      } else {
        // Need outcome when price tracking not enabled
        if (!outcome) {
          setShowOutcomeError(true);
          return;
        }
      }
    }

    // Filter out empty links
    const validLinks = tvLinks.filter(link => link.trim() !== '');

    // Parse optional fields (only include if field group is enabled)
    const parseNum = (val: string) => val.trim() ? parseFloat(val) : null;

    // Calculate outcome from direction and prices when price tracking is enabled
    let finalOutcome: OutcomeType | null = null;
    if (result === "OCCURRED") {
      if (hasPriceTracking && direction) {
        const entry = parseNum(entryPrice);
        const exit = parseNum(exitPrice);
        if (entry !== null && exit !== null) {
          // LONG wins if exit > entry, SHORT wins if exit < entry
          const isProfit = direction === 'LONG' ? exit > entry : exit < entry;
          finalOutcome = isProfit ? 'WIN' : 'LOSS';
        } else {
          // If prices not filled, can't determine outcome
          finalOutcome = null;
        }
      } else {
        finalOutcome = outcome;
      }
    }

    const newEdgeId = (isEditing && selectedEdgeId !== initialData?.edgeId) || (!edgeId && selectedEdgeId) ? selectedEdgeId : undefined;
    onSave({
      result,
      outcome: finalOutcome,
      direction: hasPriceTracking ? direction : null,
      logType,
      note,
      dayOfWeek: day,
      durationMinutes: durationNum,
      tvLinks: result === "NO_SETUP" ? [] : validLinks,
      date,
      // Optional fields (only included if enabled on edge)
      entryPrice: hasPriceTracking ? parseNum(entryPrice) : null,
      exitPrice: hasPriceTracking ? parseNum(exitPrice) : null,
      entryTime: enabledFields.includes('entryExitTimes') ? (entryTime || null) : null,
      exitTime: enabledFields.includes('entryExitTimes') ? (exitTime || null) : null,
      dailyOpen: enabledFields.includes('dailyOHLC') ? parseNum(dailyOpen) : null,
      dailyHigh: enabledFields.includes('dailyOHLC') ? parseNum(dailyHigh) : null,
      dailyLow: enabledFields.includes('dailyOHLC') ? parseNum(dailyLow) : null,
      dailyClose: enabledFields.includes('dailyOHLC') ? parseNum(dailyClose) : null,
      nyOpen: enabledFields.includes('dailyOHLC') ? parseNum(nyOpen) : null,
      positionSize: enabledFields.includes('positionSize') ? parseNum(positionSize) : null,
      symbol: hasPriceTracking ? symbol : null,
    }, newEdgeId);
    setOpen(false);
  };

  const addTvLink = () => {
    setTvLinks([...tvLinks, '']);
  };

  const updateTvLink = (index: number, value: string) => {
    const updated = [...tvLinks];
    updated[index] = value;
    setTvLinks(updated);
  };

  const removeTvLink = (index: number) => {
    setTvLinks(tvLinks.filter((_, i) => i !== index));
  };

  const isNoSetup = result === "NO_SETUP";
  const isBacktest = logType === "BACKTEST";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <button className="inline-flex items-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
            <Plus className="w-4 h-4" /> Log Day
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px] bg-[#FAF7F2] border-[#0F0F0F]/10 text-[#0F0F0F] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle
            className="text-xl tracking-tight"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {initialData ? "Edit Log" : `Log ${isBacktest ? 'Backtest' : 'Day'}${edgeName ? ` — ${edgeName}` : ""}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
          {/* Edge Selector - when editing OR when no specific edge provided */}
          {((isEditing || !edgeId) && edges.length > 1) && (
            <div className="space-y-2">
              <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Edge</Label>
              <Select value={selectedEdgeId} onValueChange={setSelectedEdgeId}>
                <SelectTrigger className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20">
                  <SelectValue placeholder="Select edge" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl">
                  {edges.map((edge) => (
                    <SelectItem key={edge.id} value={edge.id} className="rounded-lg">
                      {edge.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Log Type Toggle */}
          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Log Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`h-12 flex items-center justify-center gap-2 rounded-xl border transition-all duration-300 ${
                  logType === "FRONTTEST"
                    ? "bg-[#0F0F0F] text-[#FAF7F2] border-[#0F0F0F]"
                    : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                }`}
                onClick={() => setLogType("FRONTTEST")}
              >
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">Live</span>
              </button>
              <button
                type="button"
                className={`h-12 flex items-center justify-center gap-2 rounded-xl border transition-all duration-300 ${
                  logType === "BACKTEST"
                    ? "bg-[#0F0F0F] text-[#FAF7F2] border-[#0F0F0F]"
                    : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                }`}
                onClick={() => setLogType("BACKTEST")}
              >
                <Rewind className="w-4 h-4" />
                <span className="text-sm font-medium">Backtest</span>
              </button>
            </div>
          </div>

          {/* Occurrence Toggle */}
          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Did the setup appear?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300 ${
                  result === "OCCURRED"
                    ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                    : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                }`}
                onClick={() => setResult("OCCURRED")}
              >
                <Check className="w-5 h-5" />
                <span className="text-xs font-medium">Yes, it appeared</span>
              </button>
              <button
                type="button"
                className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300 ${
                  result === "NO_SETUP"
                    ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                    : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                }`}
                onClick={() => {
                  setResult("NO_SETUP");
                  setOutcome(null);
                }}
              >
                <X className="w-5 h-5" />
                <span className="text-xs font-medium">No setup</span>
              </button>
            </div>
          </div>

          {/* Direction/Outcome Toggle - only shown when OCCURRED */}
          {result === "OCCURRED" && (
            hasPriceTracking ? (
              /* LONG/SHORT toggle when price tracking enabled */
              <div className="space-y-2">
                <Label className={`text-xs uppercase tracking-[0.15em] ${showOutcomeError && !direction ? "text-[#C45A3B]" : "text-[#0F0F0F]/40"}`}>
                  Trade direction {showOutcomeError && !direction && <span className="normal-case tracking-normal">— required</span>}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300 ${
                      direction === "LONG"
                        ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                        : showOutcomeError && !direction
                          ? "bg-transparent border-[#C45A3B]/50 text-[#0F0F0F]/50 hover:border-[#C45A3B]"
                          : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                    }`}
                    onClick={() => { setDirection("LONG"); setShowOutcomeError(false); }}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    <span className="text-xs font-medium">Long</span>
                  </button>
                  <button
                    type="button"
                    className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300 ${
                      direction === "SHORT"
                        ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                        : showOutcomeError && !direction
                          ? "bg-transparent border-[#C45A3B]/50 text-[#0F0F0F]/50 hover:border-[#C45A3B]"
                          : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                    }`}
                    onClick={() => { setDirection("SHORT"); setShowOutcomeError(false); }}
                  >
                    <ArrowDownRight className="w-5 h-5" />
                    <span className="text-xs font-medium">Short</span>
                  </button>
                </div>
              </div>
            ) : (
              /* WIN/LOSS toggle when no price tracking */
              <div className="space-y-2">
                <Label className={`text-xs uppercase tracking-[0.15em] ${showOutcomeError && !outcome ? "text-[#C45A3B]" : "text-[#0F0F0F]/40"}`}>
                  Trade outcome {showOutcomeError && !outcome && <span className="normal-case tracking-normal">— required</span>}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300 ${
                      outcome === "WIN"
                        ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                        : showOutcomeError && !outcome
                          ? "bg-transparent border-[#C45A3B]/50 text-[#0F0F0F]/50 hover:border-[#C45A3B]"
                          : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                    }`}
                    onClick={() => { setOutcome("WIN"); setShowOutcomeError(false); }}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-medium">Win</span>
                  </button>
                  <button
                    type="button"
                    className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300 ${
                      outcome === "LOSS"
                        ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                        : showOutcomeError && !outcome
                          ? "bg-transparent border-[#C45A3B]/50 text-[#0F0F0F]/50 hover:border-[#C45A3B]"
                          : "bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/50 hover:border-[#0F0F0F]/30"
                    }`}
                    onClick={() => { setOutcome("LOSS"); setShowOutcomeError(false); }}
                  >
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-xs font-medium">Loss</span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
              <CalendarIcon className="w-3 h-3" /> Date
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`w-full h-11 px-3 text-sm bg-white border border-[#0F0F0F]/10 rounded-xl hover:border-[#0F0F0F]/20 transition-colors flex items-center gap-2 ${
                    selectedDate ? "text-[#0F0F0F]" : "text-[#0F0F0F]/40"
                  }`}
                >
                  <CalendarIcon className="w-4 h-4 text-[#0F0F0F]/40" />
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-[#FAF7F2] border-[#0F0F0F]/10 rounded-xl shadow-xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate.toISOString().split('T')[0]);
                    }
                    setCalendarOpen(false);
                  }}
                  disabled={(dateToCheck) => {
                    if (logType === "FRONTTEST" && dateToCheck > new Date()) return true;
                    return false;
                  }}
                  initialFocus
                  className="rounded-xl"
                  classNames={{
                    months: "flex flex-col",
                    month: "space-y-4",
                    caption_label: "text-sm font-medium text-[#0F0F0F]",
                    nav: "flex items-center gap-1",
                    button_previous: "size-7 bg-transparent hover:bg-[#0F0F0F]/5 rounded-full p-0 text-[#0F0F0F]/60 hover:text-[#0F0F0F]",
                    button_next: "size-7 bg-transparent hover:bg-[#0F0F0F]/5 rounded-full p-0 text-[#0F0F0F]/60 hover:text-[#0F0F0F]",
                    weekday: "text-[#0F0F0F]/40 text-xs font-medium w-8",
                    day: "w-8 h-8",
                    today: "bg-[#C45A3B]/10 text-[#C45A3B] rounded-full",
                    selected: "bg-[#0F0F0F] text-[#FAF7F2] rounded-full hover:bg-[#0F0F0F]",
                    outside: "text-[#0F0F0F]/20",
                    disabled: "text-[#0F0F0F]/20",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Day of Week</Label>
            <Select value={day} onValueChange={(v) => setDay(v as TradingDay)}>
              <SelectTrigger className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl">
                {TRADING_DAYS.map((d) => (
                  <SelectItem key={d} value={d} className="rounded-lg">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fields only shown when OCCURRED */}
          {!isNoSetup && (
            <>
              <div className="space-y-2">
                <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Duration (minutes)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" /> TradingView Links
                </Label>
                <div className="space-y-2">
                  {tvLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://www.tradingview.com/x/..."
                        value={link}
                        onChange={(e) => updateTvLink(index, e.target.value)}
                        className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeTvLink(index)}
                        className="p-2.5 rounded-xl border border-[#0F0F0F]/10 text-[#0F0F0F]/40 hover:text-[#C45A3B] hover:border-[#C45A3B]/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTvLink}
                    className="w-full h-11 rounded-xl border border-dashed border-[#0F0F0F]/20 text-[#0F0F0F]/40 hover:border-[#0F0F0F]/40 hover:text-[#0F0F0F]/60 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Screenshot Link
                  </button>
                </div>
              </div>

              {/* Entry/Exit Prices - conditional */}
              {enabledFields.includes('entryExitPrices') && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Entry / Exit Prices</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Entry"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Exit"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Contract Symbol</Label>
                    <Select
                      value={symbol || ""}
                      onValueChange={(value) => setSymbol(value as FuturesSymbol || null)}
                    >
                      <SelectTrigger className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20">
                        <SelectValue placeholder="Select symbol for $ P&L" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl max-h-[280px]">
                        <div className="px-2 py-1.5 text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider">
                          Mini
                        </div>
                        {Object.entries(FUTURES_SYMBOLS)
                          .filter(([, info]) => info.category === 'mini')
                          .map(([key, info]) => {
                            const formatted = info.multiplier >= 1000
                              ? `$${info.multiplier / 1000}k`
                              : `$${info.multiplier}`;
                            return (
                              <SelectItem key={key} value={key} className="rounded-lg">
                                <span className="flex items-center justify-between gap-2 w-full">
                                  <span className="truncate text-sm">{info.name}</span>
                                  <span className="text-[#0F0F0F]/40 text-xs shrink-0">{formatted}/pt</span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        <div className="px-2 py-1.5 text-[10px] text-[#0F0F0F]/40 uppercase tracking-wider mt-1 border-t border-[#0F0F0F]/5">
                          Micro
                        </div>
                        {Object.entries(FUTURES_SYMBOLS)
                          .filter(([, info]) => info.category === 'micro')
                          .map(([key, info]) => {
                            const formatted = info.multiplier >= 1000
                              ? `$${info.multiplier / 1000}k`
                              : `$${info.multiplier}`;
                            return (
                              <SelectItem key={key} value={key} className="rounded-lg">
                                <span className="flex items-center justify-between gap-2 w-full">
                                  <span className="truncate text-sm">{info.name}</span>
                                  <span className="text-[#0F0F0F]/40 text-xs shrink-0">{formatted}/pt</span>
                                </span>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Entry/Exit Times - conditional */}
              {enabledFields.includes('entryExitTimes') && (
                <div className="space-y-2">
                  <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Entry / Exit Times</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="time"
                      placeholder="Entry"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
                    />
                    <Input
                      type="time"
                      placeholder="Exit"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
                    />
                  </div>
                </div>
              )}

              {/* Daily OHLC - conditional */}
              {enabledFields.includes('dailyOHLC') && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Daily OHLC</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Open"
                        value={dailyOpen}
                        onChange={(e) => setDailyOpen(e.target.value)}
                        className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30 text-sm px-2"
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="High"
                        value={dailyHigh}
                        onChange={(e) => setDailyHigh(e.target.value)}
                        className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30 text-sm px-2"
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Low"
                        value={dailyLow}
                        onChange={(e) => setDailyLow(e.target.value)}
                        className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30 text-sm px-2"
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Close"
                        value={dailyClose}
                        onChange={(e) => setDailyClose(e.target.value)}
                        className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30 text-sm px-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">NY Midnight Open (True Open)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="00:00 candle open"
                      value={nyOpen}
                      onChange={(e) => setNyOpen(e.target.value)}
                      className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
                    />
                  </div>
                </div>
              )}

              {/* Position Size - conditional */}
              {enabledFields.includes('positionSize') && (
                <div className="space-y-2">
                  <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Position Size</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Lots / Contracts"
                    value={positionSize}
                    onChange={(e) => setPositionSize(e.target.value)}
                    className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
                  />
                </div>
              )}
            </>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isNoSetup ? "Why no setup?" : "What did you observe?"}
              className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl min-h-[70px] focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30 resize-none"
              maxLength={2000}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || (result === "OCCURRED" && parseInt(duration) < 1) || (result === "OCCURRED" && (hasPriceTracking ? !direction : !outcome)) || (!edgeId && edges.length > 0 && !selectedEdgeId)}
            className="w-full bg-[#0F0F0F] text-[#FAF7F2] py-3 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? "Update Log" : "Save Log"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
});
