"use client";

import { useState, useEffect } from "react";
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
  const { addEdge, updateEdge } = useEdgeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(edge?.name || "");
  const [description, setDescription] = useState(edge?.description || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(edge?.name || "");
      setDescription(edge?.description || "");
      setError(null);
      setIsSubmitting(false);
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

    setIsSubmitting(true);

    const data: EdgeInput = {
      name: name.trim(),
      description: description.trim(),
    };

    try {
      if (edge) {
        await updateEdge(edge.id, data);
      } else {
        const newEdgeId = await addEdge(data);
        if (!newEdgeId) {
          setError("Failed to create edge. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      setOpen(false);
      onSuccess?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isSubmitting) setOpen(newOpen);
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-[#FAF7F2] border-[#0F0F0F]/10 text-[#0F0F0F] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle
            className="text-xl tracking-tight"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {edge ? "Edit Edge" : "Create New Edge"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">
              Name <span className="text-[#C45A3B]">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Silver Bullet AM"
              className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/40 text-xs uppercase tracking-[0.15em]">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when and how you use this edge..."
              className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl min-h-[80px] focus:border-[#C45A3B] focus:ring-[#C45A3B]/20 placeholder:text-[#0F0F0F]/30 resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#0F0F0F]/30">{description.length}/500</p>
          </div>

          {error && (
            <p className="text-sm text-[#C45A3B]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full bg-[#0F0F0F] text-[#FAF7F2] py-3 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {edge ? "Updating..." : "Creating..."}
              </>
            ) : (
              edge ? "Update Edge" : "Create Edge"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
