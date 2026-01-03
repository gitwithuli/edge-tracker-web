"use client";

import { useState, useEffect } from "react";
import { Edge, TradeLog } from "@/lib/types";

const STORAGE_KEY = "edge-tracker-v1";

const DEFAULT_EDGES: Edge[] = [
  { id: "1", name: "RTH Gap Model", description: "Trade the 09:30 NY Opening Range Gap.", logs: [] },
  { id: "2", name: "First Presented FVG", description: "First FVG after 09:30 open.", logs: [] },
  { id: "3", name: "Silver Bullet", description: "10:00-11:00 AM NY liquidity sweep.", logs: [] },
];

export function useEdgeStore() {
  const [edges, setEdges] = useState<Edge[]>(DEFAULT_EDGES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEdges(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage whenever edges change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edges));
    }
  }, [edges, isLoaded]);

  const addLog = (edgeId: string, log: Omit<TradeLog, "id" | "date">) => {
    setEdges((prev) =>
      prev.map((edge) => {
        if (edge.id !== edgeId) return edge;
        const newLog: TradeLog = {
          ...log,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
        };
        return { ...edge, logs: [newLog, ...edge.logs] };
      })
    );
  };

  const exportData = () => {
    const dataStr = JSON.stringify(edges, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edge-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          setEdges(json);
          alert("Data imported successfully!");
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return { edges, addLog, exportData, importData, isLoaded };
}