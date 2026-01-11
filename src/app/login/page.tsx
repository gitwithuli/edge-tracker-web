"use client";

import { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoaded } = useEdgeStore();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-950 p-8 rounded-3xl border border-zinc-900">
        <h1 className="text-3xl font-bold text-white text-center mb-8">EdgeTracker</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: { background: 'white', color: 'black', fontWeight: 'bold' },
              anchor: { color: '#71717a' },
              label: { color: '#a1a1aa' },
              input: { backgroundColor: '#09090b', borderColor: '#27272a', color: 'white' },
            }
          }}
          theme="dark"
          providers={["google"]}
        />
      </div>
    </div>
  );
}
