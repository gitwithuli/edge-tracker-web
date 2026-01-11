"use client";

import { memo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Edge, TradeLogInput } from "@/lib/types";
import { getTVImageUrl } from "@/lib/utils"; // getTradingViewImageUrl yerine bunu yazın
import { History, MoreHorizontal, Pencil, Trash2, Maximize2, Minimize2, ExternalLink, ZoomIn } from "lucide-react";
import { LogDialog } from "./log-dialog";
import { cn } from "@/lib/utils"; 

interface HistorySheetProps {
  edge: Edge;
  onDeleteLog: (id: string | number) => void;
  onUpdateLog: (id: string, data: TradeLogInput) => void;
}

export const HistorySheet = memo(function HistorySheet({ edge, onDeleteLog, onUpdateLog }: HistorySheetProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {/* FIX: Explicit hover colors to prevent invisibility */}
        <Button variant="secondary" size="sm" className="w-full gap-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all">
          <History className="w-4 h-4" /> View History
        </Button>
      </SheetTrigger>
      
      <SheetContent className={cn("bg-zinc-950 border-zinc-800 text-zinc-100 p-0", isFullScreen ? "w-screen max-w-none" : "w-[400px] sm:w-[540px]")}>
       <SheetHeader className="p-6 border-b border-zinc-800 flex flex-row items-center justify-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="text-zinc-500 hover:text-white transition-colors">
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <SheetTitle className="text-zinc-100 text-xl font-bold tracking-tighter">{edge.name} History</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6 space-y-6">
            {edge.logs.length === 0 ? (
              <p className="text-center text-zinc-500 py-10 italic font-mono uppercase text-[10px] tracking-widest">No trades logged yet.</p>
            ) : (
              edge.logs.map((log) => {
                const imageUrl = getTVImageUrl(log.tvLink || ""); // Burada da ismi güncelleyin
                
                return (
                  <div key={log.id} className="relative pl-6 border-l border-zinc-800">
                    <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${log.result === "WIN" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"}`} />
                    <div className="bg-zinc-900/40 p-4 rounded-lg border border-zinc-800/50 hover:bg-zinc-900/60 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className={cn(
                          "px-2 py-0.5 font-bold text-[10px] tracking-tighter",
                          log.result === "WIN" ? "text-green-400 border-green-900/50" : "text-red-400 border-red-900/50"
                        )}>
                          {log.result}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-zinc-800 hover:text-white transition-colors">
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
                              onClick={() => { if (confirm("Delete this log?")) onDeleteLog(log.id); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* --- SMALL RENDER PREVIEW --- */}
                      {imageUrl && (
                        <div className="mt-2 mb-3 group/image relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 shadow-2xl">
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="cursor-zoom-in relative aspect-video">
                                <img
                                  src={imageUrl}
                                  alt="Trade Setup Preview"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover opacity-70 group-hover/image:opacity-100 transition-all duration-500"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/40">
                                   <div className="bg-zinc-900/90 p-2 rounded-full border border-zinc-700 shadow-xl">
                                      <ZoomIn className="w-4 h-4 text-white" />
                                   </div>
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 bg-transparent border-none flex items-center justify-center shadow-none">
                              <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                                <img 
                                  src={imageUrl} 
                                  alt="Full Scale ICT Markup" 
                                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800" 
                                />
                                <a 
                                  href={log.tvLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-lg uppercase tracking-widest"
                                >
                                  Open Original in TradingView <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      <div className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-[0.2em] mb-1">
                        {log.dayOfWeek} • {log.durationMinutes}m duration
                      </div>
                      
                      {log.note && (
                        <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-zinc-800 pl-3 py-1">
                          "{log.note}"
                        </p>
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
  );
});