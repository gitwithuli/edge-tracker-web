"use client";

import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Link as LinkIcon, Loader2, Check, X } from "lucide-react";
import type { TradeLog, TradeLogInput, ResultType, TradingDay } from "@/lib/types";
import { RESULT_TYPES, TRADING_DAYS, DEFAULT_LOG_VALUES } from "@/lib/constants";
import { useEdgeStore } from "@/hooks/use-edge-store";

interface LogDialogProps {
  edgeName?: string;
  initialData?: TradeLog;
  trigger?: React.ReactNode;
  onSave: (data: TradeLogInput) => void;
}

export const LogDialog = memo(function LogDialog({ edgeName, initialData, trigger, onSave }: LogDialogProps) {
  const [open, setOpen] = useState(false);
  const { loadingStates } = useEdgeStore();
  const isLoading = loadingStates.addingLog || loadingStates.updatingLogId !== null;

  const [result, setResult] = useState<ResultType>(initialData?.result as ResultType || DEFAULT_LOG_VALUES.result);
  const [day, setDay] = useState<TradingDay>(initialData?.dayOfWeek as TradingDay || DEFAULT_LOG_VALUES.dayOfWeek);
  const [duration, setDuration] = useState(initialData?.durationMinutes?.toString() || DEFAULT_LOG_VALUES.durationMinutes.toString());
  const [note, setNote] = useState(initialData?.note || DEFAULT_LOG_VALUES.note);
  const [tvLink, setTvLink] = useState(initialData?.tvLink || DEFAULT_LOG_VALUES.tvLink);

  // Auto-detect day of week
  useEffect(() => {
    if (open && !initialData) {
      const days: TradingDay[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as TradingDay[];
      const today = days[new Date().getDay()];
      if (TRADING_DAYS.includes(today as TradingDay)) {
        setDay(today as TradingDay);
      }
    }
  }, [open, initialData]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setResult(initialData.result as ResultType);
        setDay(initialData.dayOfWeek as TradingDay);
        setDuration(initialData.durationMinutes?.toString() || "15");
        setNote(initialData.note || "");
        setTvLink(initialData.tvLink || "");
      } else {
        setResult(DEFAULT_LOG_VALUES.result);
        setDuration(DEFAULT_LOG_VALUES.durationMinutes.toString());
        setNote(DEFAULT_LOG_VALUES.note);
        setTvLink(DEFAULT_LOG_VALUES.tvLink);
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // For NO_SETUP, we don't require duration
    const durationNum = result === "NO_SETUP" ? 0 : (parseInt(duration) || 0);
    if (result === "OCCURRED" && durationNum < 1) return;

    onSave({
      result,
      note,
      dayOfWeek: day,
      durationMinutes: durationNum,
      tvLink: result === "NO_SETUP" ? undefined : (tvLink || undefined),
    });
    setOpen(false);
  };

  const isNoSetup = result === "NO_SETUP";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button size="sm" className="w-full gap-2">
            <Plus className="w-4 h-4" /> Log Day
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {initialData ? "Edit Log" : `Log Day${edgeName ? ` - ${edgeName}` : ""}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Occurrence Toggle */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">Did the setup appear?</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={result === "OCCURRED" ? "default" : "outline"}
                className={`h-16 flex flex-col gap-1 ${
                  result === "OCCURRED"
                    ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    : "border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
                onClick={() => setResult("OCCURRED")}
              >
                <Check className="w-5 h-5" />
                <span className="text-xs font-medium">Yes, it appeared</span>
              </Button>
              <Button
                type="button"
                variant={result === "NO_SETUP" ? "default" : "outline"}
                className={`h-16 flex flex-col gap-1 ${
                  result === "NO_SETUP"
                    ? "bg-zinc-700 hover:bg-zinc-600 border-zinc-700"
                    : "border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
                onClick={() => setResult("NO_SETUP")}
              >
                <X className="w-5 h-5" />
                <span className="text-xs font-medium">No setup today</span>
              </Button>
            </div>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">Day</Label>
            <Select value={day} onValueChange={(v) => setDay(v as TradingDay)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                {TRADING_DAYS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fields only shown when OCCURRED */}
          {!isNoSetup && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest">Duration (Min)</Label>
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest flex gap-2 items-center">
                  <LinkIcon className="w-3 h-3" /> TradingView Link
                </Label>
                <Input
                  placeholder="https://www.tradingview.com/x/..."
                  value={tvLink}
                  onChange={(e) => setTvLink(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>
            </>
          )}

          {/* Note - always shown */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isNoSetup ? "Why no setup today?" : "What did you observe?"}
              className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[60px]"
              maxLength={2000}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || (result === "OCCURRED" && parseInt(duration) < 1)}
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? "Update Log" : "Save Log"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
});
