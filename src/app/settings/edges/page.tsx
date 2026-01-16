"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Pencil, Trash2, Target, Loader2 } from "lucide-react";
import { EdgeFormDialog } from "@/components/edge-form-dialog";
import { GrainOverlay } from "@/components/grain-overlay";
import Link from "next/link";

export default function EdgeSettingsPage() {
  const { edges, logs, isLoaded, user, deleteEdge, loadingStates } = useEdgeStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded || !user) {
    return null;
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteEdge(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getLogCount = (edgeId: string) => {
    return logs.filter(l => l.edgeId === edgeId).length;
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

      <div className="min-h-screen bg-[#FAF7F2] text-[#0F0F0F] selection:bg-[#C45A3B]/20">
        {/* Header */}
        <header className="border-b border-[#0F0F0F]/5 bg-[#FAF7F2]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 sm:gap-2 text-[#0F0F0F]/40 hover:text-[#0F0F0F] transition-colors text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 w-px bg-[#0F0F0F]/10" />
              <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
                <img src="/logo-icon-transparent.png" alt="Edge of ICT" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16" />
                <span
                  className="hidden sm:inline text-xs sm:text-sm tracking-[0.08em] font-medium"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  EDGE <span className="text-[#0F0F0F]/40 text-[10px] sm:text-xs">OF</span> ICT
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
                My <span className="italic text-[#0F0F0F]/60">Edges</span>
              </h1>
              <p className="text-[#0F0F0F]/40 text-xs sm:text-sm mt-1.5 sm:mt-2">
                Manage your trading strategies and models.
              </p>
            </div>

            <EdgeFormDialog
              trigger={
                <button className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Edge</span>
                </button>
              }
            />
          </div>

          {edges.length === 0 ? (
            <div
              className={`p-6 sm:p-8 lg:p-12 rounded-xl sm:rounded-2xl border-2 border-dashed border-[#0F0F0F]/10 text-center opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.2s' }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-5 rounded-full bg-[#0F0F0F]/5 flex items-center justify-center">
                <Target className="w-6 h-6 sm:w-7 sm:h-7 text-[#0F0F0F]/30" />
              </div>
              <h3
                className="text-lg sm:text-xl mb-2"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                No edges yet
              </h3>
              <p className="text-xs sm:text-sm text-[#0F0F0F]/40 mb-4 sm:mb-6 max-w-sm mx-auto">
                Create your first trading edge to start tracking occurrences.
                Common edges include Silver Bullet, London Killzone, etc.
              </p>
              <EdgeFormDialog
                trigger={
                  <button className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Create Your First Edge
                  </button>
                }
              />
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {edges.map((edge, i) => {
                const logCount = getLogCount(edge.id);
                const isDeleting = loadingStates.deletingEdgeId === edge.id;

                return (
                  <div
                    key={edge.id}
                    className={`p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#0F0F0F]/5 hover:border-[#0F0F0F]/10 transition-all duration-300 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                    style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base sm:text-lg font-normal tracking-tight text-[#0F0F0F]"
                          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                        >
                          {edge.name}
                        </h3>
                        {edge.description && (
                          <p className="text-xs sm:text-sm text-[#0F0F0F]/40 mt-1 line-clamp-2">
                            {edge.description}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-xs text-[#0F0F0F]/30 mt-2 sm:mt-3 uppercase tracking-wider">
                          {logCount} day{logCount !== 1 ? "s" : ""} logged
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 ml-2 sm:ml-4">
                        <EdgeFormDialog
                          edge={edge}
                          trigger={
                            <button className="p-2 sm:p-2.5 rounded-full text-[#0F0F0F]/30 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300">
                              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          }
                        />

                        <button
                          className="p-2 sm:p-2.5 rounded-full text-[#0F0F0F]/30 hover:text-[#C45A3B] hover:bg-[#C45A3B]/5 transition-all duration-300 disabled:opacity-50"
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
                );
              })}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0F0F0F]/5 py-4 sm:py-6 mt-8 sm:mt-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/30">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase"><img src="/logo-icon-transparent.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />Edge of ICT</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#FAF7F2] border-[#0F0F0F]/10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-[#0F0F0F] text-xl"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Delete Edge?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0F0F0F]/50">
              Are you sure you want to delete <span className="text-[#0F0F0F] font-medium">{deleteTarget?.name}</span>?
              This will also delete all {getLogCount(deleteTarget?.id || "")} days logged.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-[#0F0F0F]/10 text-[#0F0F0F]/60 hover:bg-[#0F0F0F]/5 hover:text-[#0F0F0F] rounded-full px-5">
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
    </>
  );
}
