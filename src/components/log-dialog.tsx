"use client";

import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Link as LinkIcon, Loader2 } from "lucide-react";
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

  const [result, setResult] = useState<ResultType>(initialData?.result || DEFAULT_LOG_VALUES.result);
  const [day, setDay] = useState<TradingDay>(initialData?.dayOfWeek as TradingDay || DEFAULT_LOG_VALUES.dayOfWeek);
  const [duration, setDuration] = useState(initialData?.durationMinutes?.toString() || DEFAULT_LOG_VALUES.durationMinutes.toString());
  const [note, setNote] = useState(initialData?.note || DEFAULT_LOG_VALUES.note);
  const [tvLink, setTvLink] = useState(initialData?.tvLink || DEFAULT_LOG_VALUES.tvLink);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setResult(initialData.result);
        setDay(initialData.dayOfWeek as TradingDay);
        setDuration(initialData.durationMinutes?.toString());
        setNote(initialData.note);
        setTvLink(initialData.tvLink || "");
      } else {
        setResult(DEFAULT_LOG_VALUES.result);
        setDay(DEFAULT_LOG_VALUES.dayOfWeek);
        setDuration(DEFAULT_LOG_VALUES.durationMinutes.toString());
        setNote(DEFAULT_LOG_VALUES.note);
        setTvLink(DEFAULT_LOG_VALUES.tvLink);
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationNum = parseInt(duration) || 0;
    if (durationNum < 1) return;

    onSave({
      result,
      note,
      dayOfWeek: day,
      durationMinutes: durationNum,
      tvLink: tvLink || undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button size="sm" className="w-full gap-2">
            <Plus className="w-4 h-4" /> Log Trade
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {initialData ? "Edit Log" : `Log Trade for ${edgeName}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-widest">Result</Label>
              <Select value={result} onValueChange={(v) => setResult(v as ResultType)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {RESULT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "BE" ? "Break Even" : type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

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

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you observe in this setup?"
              className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[80px]"
              maxLength={2000}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || parseInt(duration) < 1}
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
