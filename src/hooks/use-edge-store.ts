import { useEffect, useState } from "react";
import { Edge } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const initialEdges: Edge[] = [
  { id: "rth-gap", name: "RTH Gap Model", description: "Trade the 09:30 NY Opening Range Gap.", logs: [] },
  { id: "first-fvg", name: "First Presented FVG", description: "First FVG after 09:30 open.", logs: [] },
  { id: "silver-bullet", name: "Silver Bullet", description: "10:00-11:00 AM NY liquidity sweep.", logs: [] },
];

export const useEdgeStore = () => {
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const fetchLogs = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    if (!currentUser) { router.push("/login"); return; }

    const { data, error } = await supabase.from("logs").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); setIsLoaded(true); return; }

    const newEdges = initialEdges.map((edge) => ({
      ...edge,
      logs: data.filter((log: any) => log.edge_id === edge.id).map((log: any) => ({
        id: log.id,
        date: log.created_at,
        result: log.result,
        note: log.note,
        dayOfWeek: log.day_of_week,
        durationMinutes: log.duration_minutes,
      })),
    }));
    setEdges(newEdges);
    setIsLoaded(true);
  };

  useEffect(() => { fetchLogs(); }, []);

  const addLog = async (edgeId: string, logData: any) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const tempId = crypto.randomUUID();
    const newLogLocal = { ...logData, id: tempId, date: new Date().toISOString() };

    setEdges((prev) => prev.map((edge) => edge.id === edgeId ? { ...edge, logs: [newLogLocal, ...edge.logs] } : edge));

    const { data, error } = await supabase.from("logs").insert({
      user_id: currentUser.id, edge_id: edgeId, result: logData.result, note: logData.note,
      day_of_week: logData.dayOfWeek, duration_minutes: logData.durationMinutes,
    }).select().single();

    if (error) { fetchLogs(); } 
    else {
      setEdges((prev) => prev.map((edge) => edge.id === edgeId ? {
        ...edge, logs: edge.logs.map(log => log.id === tempId ? { ...log, id: data.id } : log)
      } : edge));
    }
  };

  const deleteLog = async (logId: string | number) => {
    // 1. UI UPDATE FIRST (Forces automatic refresh in UI)
    setEdges((prev) => prev.map((edge) => ({
      ...edge, 
      logs: edge.logs.filter((log) => String(log.id) !== String(logId))
    })));

    // 2. DATABASE DELETE
    const { error } = await supabase.from("logs").delete().eq("id", logId);
    
    if (error) {
      console.error("Database Delete Error:", error);
      fetchLogs(); // Revert UI if DB fails
    }
  };

  const updateLog = async (logId: string, updatedData: any) => {
    setEdges((prev) => prev.map((edge) => ({
      ...edge, 
      logs: edge.logs.map((log) => String(log.id) === String(logId) ? { ...log, ...updatedData } : log)
    })));

    await supabase.from("logs").update({
      result: updatedData.result,
      note: updatedData.note,
      day_of_week: updatedData.dayOfWeek,
      duration_minutes: updatedData.durationMinutes,
    }).eq("id", logId);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return { edges, addLog, deleteLog, updateLog, isLoaded, logout, user };
};