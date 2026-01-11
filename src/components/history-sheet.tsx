"use client";

import { memo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import type { EdgeWithLogs, TradeLogInput } from "@/lib/types";
import { getTVImageUrl } from "@/lib/utils";
import { History, MoreHorizontal, Pencil, Trash2, Maximize2, Minimize2, ExternalLink, ZoomIn, Check, X } from "lucide-react";
import { LogDialog } from "./log-dialog";
import { cn } from "@/lib/utils";

interface HistorySheetProps {
  edge: EdgeWithLogs;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, data: TradeLogInput) => void;
}

export const HistorySheet = memo(function HistorySheet({ edge, onDeleteLog, onUpdateLog }: HistorySheetProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

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
          <Button variant="outline" size="sm" className="flex-1 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900">
            <History className="w-4 h-4 mr-1" /> History
          </Button>
        </SheetTrigger>

        <SheetContent className={cn("bg-zinc-950 border-zinc-800 text-zinc-100 p-0", isFullScreen ? "w-screen max-w-none" : "w-[400px] sm:w-[540px]")}>
          <SheetHeader className="p-6 border-b border-zinc-800 flex flex-row items-center justify-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="text-zinc-500 hover:text-white transition-colors">
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <SheetTitle className="text-zinc-100 text-xl font-bold tracking-tighter">{edge.name}</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-6 space-y-4">
              {edge.logs.length === 0 ? (
                <p className="text-center text-zinc-500 py-10 italic">No days logged yet.</p>
              ) : (
                edge.logs.map((log) => {
                  const imageUrl = getTVImageUrl(log.tvLink || "");
                  const isOccurred = log.result === "OCCURRED";

                  return (
                    <div key={log.id} className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/30">
                      {/* Inline Preview - Show prominently at top */}
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
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                <div className="bg-zinc-900/90 p-2 rounded-full border border-zinc-700">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 bg-transparent border-none flex items-center justify-center shadow-none" showCloseButton={false}>
                            <DialogTitle className="sr-only">Chart Image Preview</DialogTitle>
                            <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                              <img
                                src={imageUrl}
                                alt="Full Scale Chart"
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800"
                              />
                              {log.tvLink && (
                                <a
                                  href={log.tvLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all"
                                >
                                  Open in TradingView <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Log Content */}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            {isOccurred ? (
                              <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-500" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                <X className="w-4 h-4 text-zinc-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">
                                {isOccurred ? "Setup Occurred" : "No Setup"}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {log.dayOfWeek} {log.durationMinutes > 0 && `• ${log.durationMinutes}m`}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800">
                                <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                              <LogDialog
                                initialData={log}
                                onSave={(newData) => onUpdateLog(String(log.id), newData)}
                                trigger={
                                  <div className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-zinc-800 w-full font-medium transition-colors">
                                    <Pencil className="mr-2 h-4 w-4 text-zinc-400" /> Edit
                                  </div>
                                }
                              />
                              <DropdownMenuItem
                                className="text-red-400 cursor-pointer font-medium hover:bg-red-950/30"
                                onClick={() => setDeleteLogId(log.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {log.note && (
                          <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-3 py-1">
                            {log.note}
                          </p>
                        )}

                        {log.tvLink && !imageUrl && (
                          <a
                            href={log.tvLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white mt-2"
                          >
                            <ExternalLink className="w-3 h-3" /> View on TradingView
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteLogId !== null} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Log</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete this log entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
