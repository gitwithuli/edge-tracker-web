"use client";

import { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";

export default function LoginPage() {
  const router = useRouter();
  // We destructure fetchLogs here to call it manually upon login
  const { user, isLoaded, fetchLogs } = useEdgeStore(); 

  useEffect(() => {
    // 1. Initial Check: Redirect if already logged in
    if (isLoaded && user) {
      router.push("/dashboard");
    }

    // 2. The Auto-Redirect Fix: Listen for the login event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // ✅ CRITICAL STEP: Manually trigger the Brain to update the 'user' state 
        // immediately so 'isLoaded' and 'user' are synced before the redirect.
        if (fetchLogs) await fetchLogs();
        
        router.push("/dashboard");
        router.refresh(); 
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoaded, user, router, fetchLogs]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-zinc-800">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tighter">
            EdgeTracker V2
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">
            Log in to manage your trading edges.
          </p>
        </div>

        <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-900 shadow-2xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              style: {
                button: { 
                  background: 'white', 
                  color: 'black', 
                  border: 'none',
                  fontWeight: '600',
                  borderRadius: '12px'
                },
                anchor: { color: '#71717a', fontSize: '12px' },
                label: { color: '#a1a1aa', fontSize: '12px', marginBottom: '4px' },
                input: { 
                  backgroundColor: '#09090b', 
                  borderColor: '#27272a', 
                  color: 'white',
                  borderRadius: '12px'
                },
              },
              variables: {
                default: {
                  colors: {
                    brand: '#ffffff',
                    brandAccent: '#f4f4f5',
                    brandButtonText: '#000000', 
                    defaultButtonText: '#000000',
                  },
                },
              },
            }}
            theme="dark"
            providers={["google"]}
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
          />
        </div>
        <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest">
          Prop Firm Readiness • 2026 Edition
        </p>
      </div>
    </div>
  );
}