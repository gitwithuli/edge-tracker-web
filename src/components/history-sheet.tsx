"use client";

import { memo, useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { EdgeWithLogs, TradeLogInput } from "@/lib/types";
import { getTVImageUrl } from "@/lib/utils";
import { History, MoreHorizontal, Pencil, Trash2, Maximize2, Minimize2, ExternalLink, ZoomIn, Check, X, Calendar, Play, Rewind } from "lucide-react";
import { LogDialog } from "./log-dialog";
import { cn } from "@/lib/utils";

interface HistorySheetProps {
  edge: EdgeWithLogs;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, data: TradeLogInput) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function groupLogsByDate(logs: EdgeWithLogs['logs']) {
  const sorted = [...logs].sort((a, b) => {
    const dateA = a.date || '1970-01-01';
    const dateB = b.date || '1970-01-01';
    return dateB.localeCompare(dateA);
  });

  const groups: { date: string; logs: typeof logs }[] = [];
  let currentDate = '';
  let currentGroup: typeof logs = [];

  for (const log of sorted) {
    const logDate = log.date || 'Unknown';
    if (logDate !== currentDate) {
      if (currentGroup.length > 0) {
        groups.push({ date: currentDate, logs: currentGroup });
      }
      currentDate = logDate;
      currentGroup = [log];
    } else {
      currentGroup.push(log);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ date: currentDate, logs: currentGroup });
  }

  return groups;
}

export const HistorySheet = memo(function HistorySheet({ edge, onDeleteLog, onUpdateLog }: HistorySheetProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

  const groupedLogs = useMemo(() => groupLogsByDate(edge.logs), [edge.logs]);

  const handleDeleteConfirm = () => {
    if (deleteLogId !== null) {
      onDeleteLog(deleteLogId);
      setDeleteLogId(null);
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:border-[#0F0F0F]/30 hover:text-[#0F0F0F] transition-colors duration-300">
            <History className="w-4 h-4" /> History
          </button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className={cn(
            "bg-[#FAF7F2] border-[#0F0F0F]/10 text-[#0F0F0F] p-0 flex flex-col",
            isFullScreen
              ? "!w-screen !max-w-none"
              : "w-[400px] sm:w-[540px] sm:!max-w-[540px]"
          )}
        >
          <SheetHeader className="p-6 pb-4 border-b border-[#0F0F0F]/10 flex flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="w-10 h-10 rounded-full border border-[#0F0F0F]/10 flex items-center justify-center text-[#0F0F0F]/40 hover:text-[#0F0F0F] hover:border-[#0F0F0F]/30 transition-colors"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <SheetTitle
                className="text-[#0F0F0F] text-xl tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {edge.name}
              </SheetTitle>
            </div>
            <div className="text-xs text-[#0F0F0F]/40 uppercase tracking-[0.15em]">
              {edge.logs.length} {edge.logs.length === 1 ? 'entry' : 'entries'}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {groupedLogs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0F0F0F]/5 flex items-center justify-center">
                    <History className="w-6 h-6 text-[#0F0F0F]/30" />
                  </div>
                  <p className="text-[#0F0F0F]/40 text-sm" style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>
                    No days logged yet
                  </p>
                </div>
              ) : (
                groupedLogs.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-3 h-3 text-[#0F0F0F]/30" />
                      <span className="text-xs text-[#0F0F0F]/40 uppercase tracking-[0.15em] font-medium">
                        {group.date === 'Unknown' ? 'Unknown Date' : formatDate(group.date)}
                      </span>
                      <div className="flex-1 h-px bg-[#0F0F0F]/10" />
                    </div>

                    {group.logs.map((log) => {
                      const imageUrl = getTVImageUrl(log.tvLink || "");
                      const isOccurred = log.result === "OCCURRED";
                      const isBacktest = log.logType === "BACKTEST";

                      return (
                        <div
                          key={log.id}
                          className="rounded-2xl border border-[#0F0F0F]/10 overflow-hidden bg-white/50"
                        >
                          {imageUrl && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="cursor-zoom-in relative group">
                                  <img
                                    src={imageUrl}
                                    alt="Chart snapshot"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-48 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F0F0F]/20">
                                    <div className="bg-white/90 p-3 rounded-full shadow-lg">
                                      <ZoomIn className="w-4 h-4 text-[#0F0F0F]" />
                                    </div>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 bg-transparent border-none flex items-center justify-center shadow-none">
                                <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                                  <img
                                    src={imageUrl}
                                    alt="Full Scale Chart"
                                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-[#0F0F0F]/10"
                                  />
                                  {log.tvLink && (
                                    <a
                                      href={log.tvLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-[#0F0F0F] text-[#FAF7F2] px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#C45A3B] transition-colors"
                                    >
                                      Open in TradingView <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                {isOccurred ? (
                                  <div className="w-10 h-10 rounded-full bg-[#8B9A7D]/20 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-[#8B9A7D]" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#0F0F0F]/5 flex items-center justify-center">
                                    <X className="w-4 h-4 text-[#0F0F0F]/30" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-[#0F0F0F]">
                                    {isOccurred ? "Setup Occurred" : "No Setup"}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-[#0F0F0F]/50">
                                      {log.dayOfWeek}
                                      {log.durationMinutes > 0 && ` · ${log.durationMinutes}m`}
                                    </span>
                                    <span className={cn(
                                      "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                                      isBacktest
                                        ? "bg-[#0F0F0F]/5 text-[#0F0F0F]/50"
                                        : "bg-[#C45A3B]/10 text-[#C45A3B]"
                                    )}>
                                      {isBacktest ? (
                                        <><Rewind className="w-2.5 h-2.5" /> Backtest</>
                                      ) : (
                                        <><Play className="w-2.5 h-2.5" /> Live</>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-[#0F0F0F]/5 text-[#0F0F0F]/30 hover:text-[#0F0F0F]"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-[#FAF7F2] border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl shadow-lg"
                                >
                                  <LogDialog
                                    initialData={log}
                                    onSave={(newData) => onUpdateLog(String(log.id), newData)}
                                    trigger={
                                      <div className="relative flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm hover:bg-[#0F0F0F]/5 w-full font-medium transition-colors">
                                        <Pencil className="mr-2 h-4 w-4 text-[#0F0F0F]/40" /> Edit
                                      </div>
                                    }
                                  />
                                  <DropdownMenuItem
                                    className="text-[#C45A3B] cursor-pointer font-medium hover:bg-[#C45A3B]/10 rounded-lg mx-1"
                                    onClick={() => setDeleteLogId(log.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {log.note && (
                              <p className="text-sm text-[#0F0F0F]/60 leading-relaxed border-l-2 border-[#0F0F0F]/10 pl-3 py-1 mt-2">
                                {log.note}
                              </p>
                            )}

                            {log.tvLink && !imageUrl && (
                              <a
                                href={log.tvLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#C45A3B] hover:underline mt-2"
                              >
                                <ExternalLink className="w-3 h-3" /> View on TradingView
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteLogId !== null} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <AlertDialogContent className="bg-[#FAF7F2] border-[#0F0F0F]/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-[#0F0F0F] text-lg"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Delete Log
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0F0F0F]/50">
              This will permanently delete this log entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] hover:bg-[#0F0F0F]/5 rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-[#C45A3B] text-white hover:bg-[#C45A3B]/90 rounded-full"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
