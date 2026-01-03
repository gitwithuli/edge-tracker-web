"use client";

import { useEdgeStore } from "@/hooks/use-edge-store";
import { EdgeCard } from "@/components/edge-card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useRef } from "react";

export default function Home() {
  const { edges, addLog, exportData, importData, isLoaded } = useEdgeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoaded) return null; // Avoid hydration mismatch

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            EdgeTracker V1
          </h1>
          <p className="text-zinc-500">Local-First Trading Journal</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="text-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-white" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" /> Backup Data
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Restore
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
            className="hidden"
            accept=".json"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {edges.map((edge) => (
          <EdgeCard
            key={edge.id}
            edge={edge}
            onAddLog={(logData) => addLog(edge.id, logData)}
          />
        ))}
      </div>
    </main>
  );
}