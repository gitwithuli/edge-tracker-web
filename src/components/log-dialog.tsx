import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { ResultType } from "@/lib/types";

interface LogDialogProps {
  edgeName?: string;
  initialData?: any;
  trigger?: React.ReactNode;
  onSave: (data: any) => void;
}

export function LogDialog({ edgeName, initialData, trigger, onSave }: LogDialogProps) {
  const [open, setOpen] = useState(false);

  // Initialize state
  const [result, setResult] = useState<ResultType>(initialData?.result || "WIN");
  const [day, setDay] = useState(initialData?.dayOfWeek || "Tuesday");
  const [duration, setDuration] = useState(initialData?.durationMinutes?.toString() || "15");
  const [note, setNote] = useState(initialData?.note || "");

  // Update form fields when the dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setResult(initialData.result);
        setDay(initialData.dayOfWeek);
        setDuration(initialData.durationMinutes?.toString());
        setNote(initialData.note);
      } else {
        setResult("WIN");
        setDay("Tuesday");
        setDuration("15");
        setNote("");
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      result,
      note,
      dayOfWeek: day,
      durationMinutes: parseInt(duration) || 0,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
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
              <Label className="text-zinc-400">Result</Label>
              <Select value={result} onValueChange={(v) => setResult(v as ResultType)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                {/* FIX: Added text-zinc-100 here */}
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectItem value="WIN">Win</SelectItem>
                  <SelectItem value="LOSS">Loss</SelectItem>
                  <SelectItem value="BE">Break Even</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-400">Day of Week</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                {/* FIX: Added text-zinc-100 here */}
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Duration (Minutes)</Label>
            <Input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)} 
              min="1"
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Note</Label>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="What did you see?"
              className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[100px]"
            />
          </div>

          <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200">
            {initialData ? "Update Log" : "Save Log"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}