"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import type { Edge, EdgeInput } from "@/lib/types";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { OPTIONAL_FIELD_GROUPS, FIELD_GROUP_INFO, type OptionalFieldGroup } from "@/lib/schemas";

interface EdgeFormDialogProps {
  edge?: Edge;
  trigger: React.ReactNode;
  onSuccess?: () => void;
  defaultParentEdgeId?: string; // For creating sub-edges from a parent edge page
}

export function EdgeFormDialog({ edge, trigger, onSuccess, defaultParentEdgeId }: EdgeFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { addEdge, updateEdge, edges, getSubEdges } = useEdgeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(edge?.name || "");
  const [description, setDescription] = useState(edge?.description || "");
  const [enabledFields, setEnabledFields] = useState<OptionalFieldGroup[]>(edge?.enabledFields || []);
  const [error, setError] = useState<string | null>(null);

  // Get available parent edges (only top-level edges that aren't the current edge)
  // Also exclude edges that have this edge as their parent (prevent circular references)
  const availableParentEdges = edges.filter(e => {
    // Cannot be own parent
    if (edge && e.id === edge.id) return false;
    // Cannot select an edge that is already a sub-edge (no nested sub-edges)
    if (e.parentEdgeId) return false;
    // Cannot select an edge that has this edge as a sub-edge (prevents cycles)
    if (edge) {
      const subEdges = getSubEdges(edge.id);
      if (subEdges.some(sub => sub.id === e.id)) return false;
    }
    return true;
  });

  // Validate defaultParentEdgeId - only use if it's a valid top-level edge
  const validDefaultParentId = defaultParentEdgeId && availableParentEdges.some(e => e.id === defaultParentEdgeId)
    ? defaultParentEdgeId
    : null;

  const [parentEdgeId, setParentEdgeId] = useState<string | null>(edge?.parentEdgeId || validDefaultParentId);

  useEffect(() => {
    if (open) {
      setName(edge?.name || "");
      setDescription(edge?.description || "");
      setEnabledFields(edge?.enabledFields || []);
      setParentEdgeId(edge?.parentEdgeId || validDefaultParentId);
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, edge, validDefaultParentId]);

  const toggleField = (field: OptionalFieldGroup) => {
    setEnabledFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

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
      enabledFields,
      parentEdgeId: parentEdgeId || null,
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
    } catch (err) {
      console.error("Edge form error:", err);
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
            style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
          >
            {edge ? "Edit Edge" : "Create New Edge"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
          <div className="space-y-2">
            <Label className="text-[#0F0F0F]/50 text-xs uppercase tracking-[0.15em]">
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
            <Label className="text-[#0F0F0F]/50 text-xs uppercase tracking-[0.15em]">
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
            <p className="text-xs text-[#0F0F0F]/45">{description.length}/500</p>
          </div>

          {/* Parent Edge Selector (for sub-edges) */}
          {availableParentEdges.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#0F0F0F]/50 text-xs uppercase tracking-[0.15em]">
                Parent Edge (Optional)
              </Label>
              <Select
                value={parentEdgeId || "none"}
                onValueChange={(value) => setParentEdgeId(value === "none" ? null : value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl h-11 focus:border-[#C45A3B] focus:ring-[#C45A3B]/20">
                  <SelectValue placeholder="Select parent edge" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#0F0F0F]/10 text-[#0F0F0F] rounded-xl">
                  <SelectItem value="none" className="rounded-lg">None (Standalone edge)</SelectItem>
                  {availableParentEdges.map((parentEdge) => (
                    <SelectItem key={parentEdge.id} value={parentEdge.id} className="rounded-lg">
                      {parentEdge.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#0F0F0F]/45">
                Make this a sub-edge of another edge to group them together
              </p>
            </div>
          )}

          {/* Optional Tracking Fields */}
          <div className="space-y-3 pt-2">
            <div className="border-t border-[#0F0F0F]/10 pt-4">
              <Label className="text-[#0F0F0F]/50 text-xs uppercase tracking-[0.15em]">
                Optional Tracking Fields
              </Label>
              <p className="text-xs text-[#0F0F0F]/45 mt-1">
                Enable additional fields to track for this edge
              </p>
            </div>
            <div className="space-y-2">
              {OPTIONAL_FIELD_GROUPS.map((field) => {
                const info = FIELD_GROUP_INFO[field];
                const isEnabled = enabledFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleField(field)}
                    disabled={isSubmitting}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-colors duration-200 text-left ${
                      isEnabled
                        ? "border-[#C45A3B] bg-[#C45A3B]/5"
                        : "border-[#0F0F0F]/10 bg-white hover:border-[#0F0F0F]/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isEnabled
                          ? "bg-[#C45A3B] text-white"
                          : "border-2 border-[#0F0F0F]/20"
                      }`}
                    >
                      {isEnabled && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isEnabled ? "text-[#0F0F0F]" : "text-[#0F0F0F]/70"}`}>
                        {info.label}
                      </p>
                      <p className="text-xs text-[#0F0F0F]/50 mt-0.5">
                        {info.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
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
