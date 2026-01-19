"use client";

import { memo, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { EdgeWithLogs, TradeLogInput } from "@/lib/types";
import { getTVImageUrl } from "@/lib/utils";
import { History, MoreHorizontal, Pencil, Trash2, ExternalLink, ZoomIn, Check, X, Calendar, Play, Rewind } from "lucide-react";
import { LogDialog } from "./log-dialog";
import { cn } from "@/lib/utils";

interface HistorySheetProps {
  edge: EdgeWithLogs;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, data: TradeLogInput, newEdgeId?: string) => void;
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
  const [open, setOpen] = useState(false);
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[#0F0F0F]/10 dark:border-white/20 text-[#0F0F0F]/60 dark:text-white/60 hover:border-[#0F0F0F]/30 dark:hover:border-white/40 hover:text-[#0F0F0F] dark:hover:text-white transition-colors duration-300">
            <History className="w-4 h-4" /> History
          </button>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 p-0 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-[#0F0F0F]/[0.06] dark:border-white/[0.06] shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-1">
                  Log History
                </div>
                <DialogTitle
                  className="text-2xl sm:text-3xl font-normal text-[#0F0F0F] dark:text-white"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {edge.name}
                </DialogTitle>
                <div className="text-sm text-[#0F0F0F]/40 dark:text-white/40 mt-1">
                  {edge.logs.length} {edge.logs.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 -mr-2 -mt-1 rounded-xl hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 pt-4">
            {groupedLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0F0F0F]/5 dark:bg-white/5 flex items-center justify-center">
                  <History className="w-6 h-6 text-[#0F0F0F]/30 dark:text-white/30" />
                </div>
                <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm" style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>
                  No days logged yet
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedLogs.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-3 h-3 text-[#0F0F0F]/30 dark:text-white/30" />
                      <span className="text-xs text-[#0F0F0F]/40 dark:text-white/40 uppercase tracking-[0.15em] font-medium">
                        {group.date === 'Unknown' ? 'Unknown Date' : formatDate(group.date)}
                      </span>
                      <div className="flex-1 h-px bg-[#0F0F0F]/10 dark:bg-white/10" />
                    </div>

                    <div className="space-y-3">
                      {group.logs.map((log) => {
                        const tvLinks = log.tvLinks || (log.tvLink ? [log.tvLink] : []);
                        const imageUrls = tvLinks.map(link => getTVImageUrl(link)).filter((url): url is string => url !== null);
                        const isOccurred = log.result === "OCCURRED";
                        const isBacktest = log.logType === "BACKTEST";

                        return (
                          <div
                            key={log.id}
                            className="rounded-2xl border border-[#0F0F0F]/10 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-white/[0.02]"
                          >
                            {imageUrls.length > 0 && (
                              <div className={cn(
                                "bg-[#0F0F0F]/5 dark:bg-white/5",
                                imageUrls.length > 1 && "grid grid-cols-2 gap-px"
                              )}>
                                {imageUrls.map((imageUrl, idx) => (
                                  <Dialog key={idx}>
                                    <DialogTrigger asChild>
                                      <div className="cursor-zoom-in relative group">
                                        <img
                                          src={imageUrl}
                                          alt={`Chart snapshot ${idx + 1}`}
                                          loading="lazy"
                                          decoding="async"
                                          className={cn(
                                            "w-full opacity-90 group-hover:opacity-100 transition-opacity",
                                            imageUrls.length > 1 ? "h-24 object-cover" : "h-48 object-cover"
                                          )}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F0F0F]/20">
                                          <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                            <ZoomIn className="w-3 h-3 text-[#0F0F0F]" />
                                          </div>
                                        </div>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="w-[95vw] h-[90vh] max-w-none p-0 bg-transparent border-none flex items-center justify-center shadow-none" showCloseButton={false}>
                                      <DialogTitle className="sr-only">Chart Image Preview</DialogTitle>
                                      <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                                        <img
                                          src={imageUrl}
                                          alt="Full Scale Chart"
                                          className="w-auto h-auto max-w-[90vw] max-h-[75vh] sm:max-h-[80vh] lg:max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                                        />
                                        {tvLinks[idx] && (
                                          <a
                                            href={tvLinks[idx]}
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
                                ))}
                              </div>
                            )}

                            <div className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                  {isOccurred ? (
                                    <div className="w-10 h-10 rounded-full bg-[#8B9A7D]/20 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-[#8B9A7D]" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#0F0F0F]/5 dark:bg-white/10 flex items-center justify-center">
                                      <X className="w-4 h-4 text-[#0F0F0F]/30 dark:text-white/30" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-[#0F0F0F] dark:text-white">
                                      {isOccurred ? "Setup Occurred" : "No Setup"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-[#0F0F0F]/50 dark:text-white/50">
                                        {log.dayOfWeek}
                                        {log.durationMinutes > 0 && ` · ${log.durationMinutes}m`}
                                      </span>
                                      <span className={cn(
                                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                                        isBacktest
                                          ? "bg-[#0F0F0F]/5 dark:bg-white/10 text-[#0F0F0F]/50 dark:text-white/50"
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
                                      className="h-8 w-8 p-0 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 text-[#0F0F0F]/30 dark:text-white/30 hover:text-[#0F0F0F] dark:hover:text-white"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F] dark:text-white rounded-xl shadow-lg"
                                  >
                                    <LogDialog
                                      initialData={log}
                                      edgeId={log.edgeId}
                                      onSave={(newData, newEdgeId) => onUpdateLog(String(log.id), newData, newEdgeId)}
                                      trigger={
                                        <div className="relative flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 w-full font-medium transition-colors">
                                          <Pencil className="mr-2 h-4 w-4 text-[#0F0F0F]/40 dark:text-white/40" /> Edit
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
                                <p className="text-sm text-[#0F0F0F]/60 dark:text-white/60 leading-relaxed border-l-2 border-[#0F0F0F]/10 dark:border-white/10 pl-3 py-1 mt-2">
                                  {log.note}
                                </p>
                              )}

                              {tvLinks.length > 0 && imageUrls.length === 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {tvLinks.map((link, idx) => (
                                    <a
                                      key={idx}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-[#C45A3B] hover:underline"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Chart {tvLinks.length > 1 ? idx + 1 : ''}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteLogId !== null} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <AlertDialogContent className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-[#0F0F0F] dark:text-white text-lg"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Delete Log
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0F0F0F]/50 dark:text-white/50">
              This will permanently delete this log entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white dark:bg-white/10 border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F] dark:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/20 rounded-full">
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
