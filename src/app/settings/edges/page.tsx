"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Pencil, Trash2, Target, Loader2, ChevronRight, Share2, RotateCcw } from "lucide-react";
import { EdgeFormDialog } from "@/components/edge-form-dialog";
import { ShareEdgeDialog } from "@/components/share-edge-dialog";
import { GrainOverlay } from "@/components/grain-overlay";
import Link from "next/link";

export default function EdgeSettingsPage() {
  const { edges, logs, isLoaded, user, deleteEdge, loadingStates, fetchEdges, fetchLogs } = useEdgeStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showFreshStart, setShowFreshStart] = useState(false);
  const [freshStartConfirm, setFreshStartConfirm] = useState("");
  const [freshStartLoading, setFreshStartLoading] = useState(false);
  const [freshStartResult, setFreshStartResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/login');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/40 dark:text-white/40" />
      </div>
    );
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteEdge(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleFreshStart = async () => {
    if (freshStartConfirm !== "FRESH START") return;

    setFreshStartLoading(true);
    setFreshStartResult(null);

    try {
      const response = await fetch("/api/reset-edges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmCode: "FRESH_START_2025",
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset edges");
      }

      setFreshStartResult({
        success: true,
        message: `Fresh start complete! Deleted ${data.deletedLogs} logs and reset ${data.updatedEdges} edges.`,
      });

      // Refresh the store data
      await Promise.all([fetchEdges(), fetchLogs()]);

      // Close dialog after a delay
      setTimeout(() => {
        setShowFreshStart(false);
        setFreshStartConfirm("");
        setFreshStartResult(null);
      }, 2000);
    } catch (error) {
      setFreshStartResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setFreshStartLoading(false);
    }
  };

  const getLogCount = (edgeId: string) => {
    return logs.filter(l => l.edgeId === edgeId).length;
  };

  // Get parent edges (no parentEdgeId) and standalone edges
  const parentEdges = edges.filter(e => !e.parentEdgeId);
  const getSubEdges = (parentId: string) => edges.filter(e => e.parentEdgeId === parentId);

  // Helper to render an edge card
  const EdgeCard = ({ edge, isSubEdge = false, index }: { edge: typeof edges[0]; isSubEdge?: boolean; index: number }) => {
    const logCount = getLogCount(edge.id);
    const isDeleting = loadingStates.deletingEdgeId === edge.id;
    const subEdges = getSubEdges(edge.id);
    const hasSubEdges = subEdges.length > 0;

    return (
      <div key={edge.id}>
        <div
          className={`p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-[#0F0F0F]/5 dark:border-white/10 hover:border-[#0F0F0F]/10 dark:hover:border-white/20 transition-all duration-300 opacity-0 ${mounted ? 'animate-slide-up' : ''} ${isSubEdge ? 'ml-4 sm:ml-6 border-l-2 border-l-[#8B9A7D]/30 dark:border-l-[#8B9A7D]/20' : ''}`}
          style={{ animationDelay: `${0.15 + index * 0.05}s` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isSubEdge && (
                  <ChevronRight className="w-3 h-3 text-[#8B9A7D]" />
                )}
                <h3
                  className={`font-normal tracking-tight text-[#0F0F0F] dark:text-white ${isSubEdge ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {edge.name}
                </h3>
                {hasSubEdges && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8B9A7D]/10 text-[#8B9A7D] font-medium">
                    {subEdges.length} sub
                  </span>
                )}
              </div>
              {edge.description && (
                <p className={`text-[#0F0F0F]/40 dark:text-white/40 mt-1 line-clamp-2 ${isSubEdge ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                  {edge.description}
                </p>
              )}
              <p className="text-[10px] sm:text-xs text-[#0F0F0F]/30 dark:text-white/30 mt-2 sm:mt-3 uppercase tracking-wider">
                {logCount} day{logCount !== 1 ? "s" : ""} logged
              </p>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 ml-2 sm:ml-4">
              <ShareEdgeDialog
                edge={edge}
                trigger={
                  <button className={`p-2 sm:p-2.5 rounded-full transition-all duration-300 ${edge.isPublic ? 'text-[#8B9A7D] hover:bg-[#8B9A7D]/10' : 'text-[#0F0F0F]/30 dark:text-white/30 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5'}`}>
                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                }
              />

              <EdgeFormDialog
                edge={edge}
                trigger={
                  <button className="p-2 sm:p-2.5 rounded-full text-[#0F0F0F]/30 dark:text-white/30 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-all duration-300">
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                }
              />

              <button
                className="p-2 sm:p-2.5 rounded-full text-[#0F0F0F]/30 dark:text-white/30 hover:text-[#C45A3B] hover:bg-[#C45A3B]/5 transition-all duration-300 disabled:opacity-50"
                onClick={() => setDeleteTarget({ id: edge.id, name: edge.name })}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Render sub-edges */}
        {hasSubEdges && (
          <div className="mt-2 space-y-2">
            {subEdges.map((subEdge, subIndex) => (
              <EdgeCard key={subEdge.id} edge={subEdge} isSubEdge index={index + subIndex + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.6s ease-out forwards;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white selection:bg-[#C45A3B]/20 transition-colors duration-300">
        {/* Header */}
        <header className="border-b border-[#0F0F0F]/5 dark:border-white/5 bg-[#FAF7F2]/80 dark:bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 sm:gap-2 text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 w-px bg-[#0F0F0F]/10 dark:bg-white/10" />
              <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
                <img src="/logo-icon-transparent.png" alt="Edge of ICT" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16" />
                <span
                  className="hidden sm:inline text-xs sm:text-sm tracking-[0.08em] font-medium"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  EDGE <span className="text-[#0F0F0F]/40 dark:text-white/40 text-[10px] sm:text-xs">OF</span> ICT
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div
            className={`flex items-start justify-between mb-6 sm:mb-8 lg:mb-10 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <div>
              <p className="text-[#C45A3B] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-2 sm:mb-3">
                Settings
              </p>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                My <span className="italic text-[#0F0F0F]/60 dark:text-white/60">Edges</span>
              </h1>
              <p className="text-[#0F0F0F]/40 dark:text-white/40 text-xs sm:text-sm mt-1.5 sm:mt-2">
                Manage your trading strategies and models.
              </p>
            </div>

            <EdgeFormDialog
              trigger={
                <button className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Edge</span>
                </button>
              }
            />
          </div>

          {edges.length === 0 ? (
            <div
              className={`p-6 sm:p-8 lg:p-12 rounded-xl sm:rounded-2xl border-2 border-dashed border-[#0F0F0F]/10 dark:border-white/10 text-center opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.2s' }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-5 rounded-full bg-[#0F0F0F]/5 dark:bg-white/5 flex items-center justify-center">
                <Target className="w-6 h-6 sm:w-7 sm:h-7 text-[#0F0F0F]/30 dark:text-white/30" />
              </div>
              <h3
                className="text-lg sm:text-xl mb-2"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                No edges yet
              </h3>
              <p className="text-xs sm:text-sm text-[#0F0F0F]/40 dark:text-white/40 mb-4 sm:mb-6 max-w-sm mx-auto">
                Create your first trading edge to start tracking occurrences.
                Common edges include Silver Bullet, London Killzone, etc.
              </p>
              <EdgeFormDialog
                trigger={
                  <button className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Create Your First Edge
                  </button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {parentEdges.map((edge, i) => (
                <EdgeCard key={edge.id} edge={edge} index={i} />
              ))}
            </div>
          )}

          {/* Fresh Start Section */}
          {edges.length > 0 && (
            <div
              className={`mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-[#C45A3B]/20 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: `${0.2 + edges.length * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#C45A3B]/10 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-[#C45A3B]" />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-lg sm:text-xl text-[#0F0F0F] dark:text-white mb-1.5"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    Fresh Start
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0F0F0F]/50 dark:text-white/50 mb-4 max-w-md">
                    Reset all your edges to start tracking from today. This will delete all logs
                    and set each edge&apos;s creation date to today for accurate occurrence rate calculation.
                  </p>
                  <button
                    onClick={() => setShowFreshStart(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C45A3B]/30 text-[#C45A3B] text-xs sm:text-sm font-medium hover:bg-[#C45A3B]/5 transition-colors duration-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start Fresh
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0F0F0F]/5 dark:border-white/5 py-4 sm:py-6 mt-8 sm:mt-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/30 dark:text-white/30">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase"><img src="/logo-icon-transparent.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />Edge of ICT</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-[#0F0F0F] dark:text-white text-xl"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Delete Edge?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0F0F0F]/50 dark:text-white/50">
              Are you sure you want to delete <span className="text-[#0F0F0F] dark:text-white font-medium">{deleteTarget?.name}</span>?
              This will also delete all {getLogCount(deleteTarget?.id || "")} days logged.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 hover:text-[#0F0F0F] dark:hover:text-white rounded-full px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[#C45A3B] text-white hover:bg-[#B34D30] rounded-full px-5"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fresh Start Confirmation Dialog */}
      <AlertDialog open={showFreshStart} onOpenChange={(open) => {
        if (!open && !freshStartLoading) {
          setShowFreshStart(false);
          setFreshStartConfirm("");
          setFreshStartResult(null);
        }
      }}>
        <AlertDialogContent className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-[#0F0F0F] dark:text-white text-xl flex items-center gap-2"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              <RotateCcw className="w-5 h-5 text-[#C45A3B]" />
              Fresh Start
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0F0F0F]/50 dark:text-white/50 space-y-3">
              <span className="block">
                This will permanently delete all your trade logs and reset all edge creation dates to today.
              </span>
              <span className="block text-[#C45A3B] font-medium">
                This action cannot be undone.
              </span>
              <span className="block mt-4">
                Type <span className="font-mono bg-[#0F0F0F]/5 dark:bg-white/10 px-1.5 py-0.5 rounded">FRESH START</span> to confirm:
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Input
              value={freshStartConfirm}
              onChange={(e) => setFreshStartConfirm(e.target.value)}
              placeholder="Type FRESH START"
              className="bg-white dark:bg-white/5 border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F] dark:text-white placeholder:text-[#0F0F0F]/30 dark:placeholder:text-white/30"
              disabled={freshStartLoading}
            />
          </div>

          {freshStartResult && (
            <div className={`p-3 rounded-lg text-sm ${freshStartResult.success ? 'bg-[#8B9A7D]/10 text-[#8B9A7D]' : 'bg-[#C45A3B]/10 text-[#C45A3B]'}`}>
              {freshStartResult.message}
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              className="bg-transparent border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 hover:text-[#0F0F0F] dark:hover:text-white rounded-full px-5"
              disabled={freshStartLoading}
            >
              Cancel
            </AlertDialogCancel>
            <button
              onClick={handleFreshStart}
              disabled={freshStartConfirm !== "FRESH START" || freshStartLoading}
              className="inline-flex items-center justify-center gap-2 bg-[#C45A3B] text-white hover:bg-[#B34D30] rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {freshStartLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reset Everything
                </>
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
