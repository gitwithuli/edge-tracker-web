"use client";

import { useState, useEffect } from "react";
import { useEdgeStore } from "@/hooks/use-edge-store";
import type { Edge } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";

interface ShareEdgeDialogProps {
  edge: Edge;
  trigger: React.ReactNode;
}

export function ShareEdgeDialog({ edge, trigger }: ShareEdgeDialogProps) {
  const { updateEdgeSharing, loadingStates } = useEdgeStore();
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(edge.isPublic || false);
  const [showTrades, setShowTrades] = useState(edge.showTrades !== false);
  const [showScreenshots, setShowScreenshots] = useState(edge.showScreenshots !== false);
  const [publicSlug, setPublicSlug] = useState(edge.publicSlug || null);
  const [copied, setCopied] = useState(false);

  const isLoading = loadingStates.updatingEdgeId === edge.id;

  // Reset state when edge changes
  useEffect(() => {
    setIsPublic(edge.isPublic || false);
    setShowTrades(edge.showTrades !== false);
    setShowScreenshots(edge.showScreenshots !== false);
    setPublicSlug(edge.publicSlug || null);
  }, [edge]);

  const handlePublicToggle = async (checked: boolean) => {
    setIsPublic(checked);
    const slug = await updateEdgeSharing(edge.id, checked, showTrades, showScreenshots);
    if (slug) {
      setPublicSlug(slug);
    }
  };

  const handleShowTradesToggle = async (checked: boolean) => {
    setShowTrades(checked);
    if (isPublic) {
      await updateEdgeSharing(edge.id, isPublic, checked, showScreenshots);
    }
  };

  const handleShowScreenshotsToggle = async (checked: boolean) => {
    setShowScreenshots(checked);
    if (isPublic) {
      await updateEdgeSharing(edge.id, isPublic, showTrades, checked);
    }
  };

  const shareUrl = publicSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${publicSlug}`
    : null;

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnX = () => {
    if (shareUrl) {
      const text = `Check out my trading edge: ${edge.name}`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle
            className="text-[#0F0F0F] dark:text-white text-xl"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Share Edge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Make this edge public</p>
              <p className="text-xs text-[#0F0F0F]/50 dark:text-white/50">
                Anyone with the link can view stats
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handlePublicToggle}
              disabled={isLoading}
            />
          </div>

          {/* Privacy Options (only show when public) */}
          {isPublic && (
            <div className="space-y-4 pt-4 border-t border-[#0F0F0F]/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Show individual trades</p>
                  <p className="text-xs text-[#0F0F0F]/50 dark:text-white/50">
                    Display trade history
                  </p>
                </div>
                <Switch
                  checked={showTrades}
                  onCheckedChange={handleShowTradesToggle}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Show screenshots</p>
                  <p className="text-xs text-[#0F0F0F]/50 dark:text-white/50">
                    Display TradingView screenshots
                  </p>
                </div>
                <Switch
                  checked={showScreenshots}
                  onCheckedChange={handleShowScreenshotsToggle}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Share Link (only show when public) */}
          {isPublic && shareUrl && (
            <div className="pt-4 border-t border-[#0F0F0F]/10 dark:border-white/10">
              <p className="text-xs text-[#0F0F0F]/50 dark:text-white/50 mb-2">
                Share link
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-lg px-3 py-2 text-sm truncate">
                  {shareUrl}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2 rounded-lg bg-[#0F0F0F]/5 dark:bg-white/5 hover:bg-[#0F0F0F]/10 dark:hover:bg-white/10 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#8B9A7D]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#0F0F0F]/5 dark:bg-white/5 hover:bg-[#0F0F0F]/10 dark:hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Share on X Button */}
              <button
                onClick={shareOnX}
                className="w-full mt-4 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] py-2.5 rounded-full font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#0F0F0F]/40 dark:text-white/40" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
