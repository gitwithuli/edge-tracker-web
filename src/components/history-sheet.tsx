import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edge } from "@/lib/types";
import { History, MoreHorizontal, Pencil, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { LogDialog } from "./log-dialog";
import { cn } from "@/lib/utils"; 

interface HistorySheetProps {
  edge: Edge;
  onDeleteLog: (id: string | number) => void;
  onUpdateLog: (id: string, data: any) => void;
}

export function HistorySheet({ edge, onDeleteLog, onUpdateLog }: HistorySheetProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full gap-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all">
          <History className="w-4 h-4" /> View History
        </Button>
      </SheetTrigger>
      
      <SheetContent className={cn("bg-zinc-950 border-zinc-800 text-zinc-100 p-0", isFullScreen ? "w-screen max-w-none" : "w-[400px] sm:w-[540px]")}>
       <SheetHeader className="p-6 border-b border-zinc-800 flex flex-row items-center justify-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="text-zinc-500 hover:text-white">
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <SheetTitle className="text-zinc-100 text-xl">{edge.name} History</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6 space-y-6">
            {edge.logs.length === 0 ? (
              <p className="text-center text-zinc-500 py-10">No trades logged yet.</p>
            ) : (
              edge.logs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l border-zinc-800">
                  <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${log.result === "WIN" ? "bg-green-500" : "bg-red-500"}`} />
                  <div className="bg-zinc-900/40 p-4 rounded-lg border border-zinc-800/50">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className={log.result === "WIN" ? "text-green-400 border-green-900" : "text-red-400 border-red-900"}>{log.result}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-zinc-800 focus:outline-none">
                            <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <div onSelect={(e) => e.preventDefault()}>
                             <LogDialog 
                                initialData={log} 
                                onSave={(newData) => onUpdateLog(String(log.id), newData)} 
                                trigger={
                                  <div className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-zinc-800 w-full"><Pencil className="mr-2 h-4 w-4" /> Edit</div>
                                } 
                              />
                          </div>
                          <DropdownMenuItem 
                            className="text-red-400 cursor-pointer" 
                            onClick={() => { if (confirm("Delete this log?")) onDeleteLog(log.id); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">{log.dayOfWeek} • {log.durationMinutes}m</div>
                    {log.note && <p className="text-sm text-zinc-300 mt-2">{log.note}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}