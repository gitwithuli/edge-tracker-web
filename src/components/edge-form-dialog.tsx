"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Edge, EdgeInput } from "@/lib/types";
import { useEdgeStore } from "@/hooks/use-edge-store";

interface EdgeFormDialogProps {
  edge?: Edge;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function EdgeFormDialog({ edge, trigger, onSuccess }: EdgeFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { loadingStates, addEdge, updateEdge } = useEdgeStore();
  const isLoading = loadingStates.addingEdge || loadingStates.updatingEdgeId !== null;

  const [name, setName] = useState(edge?.name || "");
  const [description, setDescription] = useState(edge?.description || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(edge?.name || "");
      setDescription(edge?.description || "");
      setError(null);
    }
  }, [open, edge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }

    const data: EdgeInput = {
      name: name.trim(),
      description: description.trim(),
    };

    if (edge) {
      await updateEdge(edge.id, data);
    } else {
      await addEdge(data);
    }

    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {edge ? "Edit Edge" : "Create New Edge"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Silver Bullet AM"
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when and how you use this edge..."
              className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-zinc-600">{description.length}/500</p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {edge ? "Updating..." : "Creating..."}
              </>
            ) : (
              edge ? "Update Edge" : "Create Edge"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
