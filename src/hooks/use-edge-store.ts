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
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      const path = typeof window !== 'undefined' ? window.location.pathname : "";

      if (!currentUser && path.startsWith("/dashboard")) {
        router.push("/");
        return;
      }

      if (currentUser && (path === "/" || path === "/login")) {
        router.push("/dashboard");
        return;
      }

      if (currentUser) {
        const { data, error } = await supabase.from("logs").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        if (data) {
          const newEdges = initialEdges.map((edge) => ({
            ...edge,
            logs: data.filter((log: any) => log.edge_id === edge.id).map((log: any) => ({
              id: log.id, date: log.created_at, result: log.result, note: log.note, dayOfWeek: log.day_of_week, durationMinutes: log.duration_minutes,
            })),
          }));
          setEdges(newEdges);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const addLog = async (edgeId: string, logData: any) => {
    if (!user) return;
    await supabase.from("logs").insert({
      user_id: user.id, edge_id: edgeId, result: logData.result, note: logData.note, day_of_week: logData.dayOfWeek, duration_minutes: logData.durationMinutes,
    });
    await fetchLogs();
  };

  const deleteLog = async (logId: string | number) => {
    await supabase.from("logs").delete().eq("id", logId);
    await fetchLogs();
  };

  const updateLog = async (logId: string, logData: any) => {
    await supabase.from("logs").update({
      result: logData.result, note: logData.note, day_of_week: logData.dayOfWeek, duration_minutes: logData.durationMinutes,
    }).eq("id", logId);
    await fetchLogs();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  // ... mevcut kodlarınız ...

return { 
  edges, 
  isLoaded, 
  logout, 
  user, 
  addLog, 
  deleteLog, 
  updateLog, 
  fetchLogs // 👈 KRİTİK: TypeScript hatasını çözen satır burası
};

  
};