"use client";

import { useEdgeStore } from "@/hooks/use-edge-store";
import { EdgeCard } from "@/components/edge-card";
import { Button } from "@/components/ui/button";
import { LogOut, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  // Destructure the new delete and update functions we will add to the store
  const { edges, isLoaded, logout, user, addLog, deleteLog, updateLog } = useEdgeStore();

  // STRICT GATEKEEPER: If not loaded yet, or no user exists, render nothing.
  // The useEdgeStore hook will handle the actual redirect to "/".
  if (!isLoaded || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800">
      <header className="border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold tracking-tighter text-white">EdgeTracker V2</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 hidden md:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-zinc-400 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-white">Trading Models</h2>
          <p className="text-zinc-500">Track your ICT edges and execution performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {edges.map((edge) => (
            <EdgeCard 
              key={edge.id} 
              edge={edge} 
              onAddLog={(data) => addLog(edge.id, data)}
              onDeleteLog={deleteLog} // Passing these back to the EdgeCard
              onUpdateLog={updateLog} // Passing these back to the EdgeCard
            />
          ))}
        </div>
      </main>
    </div>
  );
}