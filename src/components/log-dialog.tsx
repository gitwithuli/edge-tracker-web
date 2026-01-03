import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { ResultType } from "@/lib/types";

interface LogDialogProps {
  edgeName: string;
  onSave: (data: { result: ResultType; note: string; dayOfWeek: string; durationMinutes: number }) => void;
}

export function LogDialog({ edgeName, onSave }: LogDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ResultType>("WIN");
  const [day, setDay] = useState("Tuesday");
  const [duration, setDuration] = useState("15");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      result,
      note,
      dayOfWeek: day,
      durationMinutes: parseInt(duration) || 0,
    });
    setOpen(false);
    setNote(""); // Reset note
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full gap-2">
          <Plus className="w-4 h-4" /> Log Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Trade for {edgeName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Result</Label>
              <Select value={result} onValueChange={(v) => setResult(v as ResultType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIN">Win</SelectItem>
                  <SelectItem value="LOSS">Loss</SelectItem>
                  <SelectItem value="BE">Break Even</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration (Minutes)</Label>
            <Input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)} 
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="What did you see?"
            />
          </div>

          <Button type="submit">Save Log</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}