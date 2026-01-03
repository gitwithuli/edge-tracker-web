"use client";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { EdgeCard } from "@/components/edge-card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Home() {
  const { edges, addLog, deleteLog, updateLog, isLoaded, logout, user } = useEdgeStore();

  if (!isLoaded) return null; 

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">EdgeTracker V2</h1>
          <p className="text-zinc-500">Cloud-Synced Trading Journal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={logout} className="text-zinc-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {edges.map((edge) => (
          <EdgeCard
            key={edge.id}
            edge={edge}
            onAddLog={(data) => addLog(edge.id, data)}
            onDeleteLog={deleteLog}
            onUpdateLog={updateLog}
          />
        ))}
      </div>
    </main>
  );
}