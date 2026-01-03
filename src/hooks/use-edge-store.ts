"use client";

import { useState, useEffect } from "react";
import { Edge, TradeLog } from "@/lib/types";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Hardcoded definitions for the edges (since we only store LOGS in the DB now)
const EDGE_DEFINITIONS = [
  { id: "1", name: "RTH Gap Model", description: "Trade the 09:30 NY Opening Range Gap." },
  { id: "2", name: "First Presented FVG", description: "First FVG after 09:30 open." },
  { id: "3", name: "Silver Bullet", description: "10:00-11:00 AM NY liquidity sweep." },
];

export function useEdgeStore() {
  const [edges, setEdges] = useState<Edge[]>(EDGE_DEFINITIONS.map(e => ({ ...e, logs: [] })));
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  // 1. Check Auth & Fetch Data on Mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      fetchLogs();
    }
    init();
  }, []);

  // 2. Fetch Logs from Supabase
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

   if (error) {
      console.error('Error fetching logs:', error);
      // Don't return here! Let the app load anyway (with empty data) so you can see the UI.
      setIsLoaded(true); 
      return;
    }

    // Merge DB logs into our Edge structure
    const newEdges = EDGE_DEFINITIONS.map(def => ({
      ...def,
      logs: data
        .filter((log: any) => log.edge_id === def.id)
        .map((log: any) => ({
          id: log.id,
          date: log.created_at,
          result: log.result,
          note: log.note,
          dayOfWeek: log.day_of_week,
          durationMinutes: log.duration_minutes
        }))
    }));

    setEdges(newEdges);
    setIsLoaded(true);
  };

  // 3. Add Log (Push to Supabase)
  const addLog = async (edgeId: string, logData: any) => {
    // Optimistic Update (Show it immediately)
    const tempId = crypto.randomUUID();
    const newLogLocal = { 
      ...logData, 
      id: tempId, 
      date: new Date().toISOString() 
    };

    setEdges(prev => prev.map(edge => {
      if (edge.id !== edgeId) return edge;
      return { ...edge, logs: [newLogLocal, ...edge.logs] };
    }));

    // Send to DB
    const { error } = await supabase.from('logs').insert({
      edge_id: edgeId,
      result: logData.result,
      note: logData.note,
      day_of_week: logData.dayOfWeek,
      duration_minutes: logData.durationMinutes,
      // user_id is handled automatically by the DB default
    });

    if (error) {
      alert("Failed to save log to cloud!");
      console.error(error);
      // Revert changes if needed (omitted for simplicity)
    } else {
      // Refresh to get the real ID from server
      fetchLogs();
    }
  };

  // 4. Logout Function
  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return { edges, addLog, isLoaded, logout, user }; // Removed export/import as DB handles it
}