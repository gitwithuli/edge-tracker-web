"use client";

import { useState } from "react";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp, Loader2 } from "lucide-react";
import { EdgeFormDialog } from "@/components/edge-form-dialog";
import Link from "next/link";

export default function EdgeSettingsPage() {
  const { edges, logs, isLoaded, user, deleteEdge, loadingStates } = useEdgeStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white" />
            <h1 className="text-lg font-bold tracking-tighter text-white">EdgeTracker</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">My Edges</h2>
            <p className="text-zinc-500 text-sm">
              Manage your trading strategies and models.
            </p>
          </div>

          <EdgeFormDialog
            trigger={
              <Button className="bg-white text-black hover:bg-zinc-200 font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                New Edge
              </Button>
            }
          />
        </div>

        {edges.length === 0 ? (
          <Card className="bg-zinc-950 border-zinc-800 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-400 mb-2">No edges yet</h3>
              <p className="text-sm text-zinc-600 mb-6 max-w-sm mx-auto">
                Create your first trading edge to start tracking your performance.
                Common edges include Silver Bullet, London Killzone, etc.
              </p>
              <EdgeFormDialog
                trigger={
                  <Button className="bg-white text-black hover:bg-zinc-200 font-semibold">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Edge
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {edges.map((edge) => {
              const logCount = getLogCount(edge.id);
              const isDeleting = loadingStates.deletingEdgeId === edge.id;

              return (
                <Card key={edge.id} className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white">{edge.name}</h3>
                        {edge.description && (
                          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                            {edge.description}
                          </p>
                        )}
                        <p className="text-xs text-zinc-600 mt-2">
                          {logCount} trade{logCount !== 1 ? "s" : ""} logged
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <EdgeFormDialog
                          edge={edge}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-500 hover:text-white"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          }
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-500 hover:text-red-500"
                          onClick={() => setDeleteTarget({ id: edge.id, name: edge.name })}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Edge?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete <span className="text-white font-medium">{deleteTarget?.name}</span>?
              This will also delete all {getLogCount(deleteTarget?.id || "")} trade logs associated with this edge.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
