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
import Link from "next/link";

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

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
          <div className="max-w-3xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-[#0F0F0F]/40 hover:text-[#0F0F0F] transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 w-px bg-[#0F0F0F]/10" />
              <span className="text-sm tracking-[0.2em] uppercase font-medium">EdgeTracker</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <div
            className={`flex items-start justify-between mb-10 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <div>
              <p className="text-[#C45A3B] text-xs tracking-[0.3em] uppercase font-medium mb-3">
                Settings
              </p>
              <h1
                className="text-3xl sm:text-4xl tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                My <span className="italic text-[#0F0F0F]/60">Edges</span>
              </h1>
              <p className="text-[#0F0F0F]/40 text-sm mt-2">
                Manage your trading strategies and models.
              </p>
            </div>

            <EdgeFormDialog
              trigger={
                <button className="inline-flex items-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Edge</span>
                </button>
              }
            />
          </div>

          {edges.length === 0 ? (
            <div
              className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed border-[#0F0F0F]/10 text-center opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.2s' }}
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#0F0F0F]/5 flex items-center justify-center">
                <Target className="w-7 h-7 text-[#0F0F0F]/30" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                No edges yet
              </h3>
              <p className="text-sm text-[#0F0F0F]/40 mb-6 max-w-sm mx-auto">
                Create your first trading edge to start tracking occurrences.
                Common edges include Silver Bullet, London Killzone, etc.
              </p>
              <EdgeFormDialog
                trigger={
                  <button className="inline-flex items-center gap-2 bg-[#0F0F0F] text-[#FAF7F2] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#C45A3B] transition-colors duration-300">
                    <Plus className="w-4 h-4" />
                    Create Your First Edge
                  </button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {edges.map((edge, i) => {
                const logCount = getLogCount(edge.id);
                const isDeleting = loadingStates.deletingEdgeId === edge.id;

                return (
                  <div
                    key={edge.id}
                    className={`p-5 sm:p-6 rounded-2xl bg-white border border-[#0F0F0F]/5 hover:border-[#0F0F0F]/10 transition-all duration-300 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                    style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-normal tracking-tight text-[#0F0F0F]"
                          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                        >
                          {edge.name}
                        </h3>
                        {edge.description && (
                          <p className="text-sm text-[#0F0F0F]/40 mt-1 line-clamp-2">
                            {edge.description}
                          </p>
                        )}
                        <p className="text-xs text-[#0F0F0F]/30 mt-3 uppercase tracking-wider">
                          {logCount} day{logCount !== 1 ? "s" : ""} logged
                        </p>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <EdgeFormDialog
                          edge={edge}
                          trigger={
                            <button className="p-2.5 rounded-full text-[#0F0F0F]/30 hover:text-[#0F0F0F] hover:bg-[#0F0F0F]/5 transition-all duration-300">
                              <Pencil className="w-4 h-4" />
                            </button>
                          }
                        />

                        <button
                          className="p-2.5 rounded-full text-[#0F0F0F]/30 hover:text-[#C45A3B] hover:bg-[#C45A3B]/5 transition-all duration-300 disabled:opacity-50"
                          onClick={() => setDeleteTarget({ id: edge.id, name: edge.name })}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
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
        <footer className="border-t border-[#0F0F0F]/5 py-6 mt-12">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#0F0F0F]/30">
            <span className="tracking-[0.15em] uppercase">EdgeTracker</span>
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
