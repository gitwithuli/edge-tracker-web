"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback - Supabase will automatically
    // detect tokens in the URL hash (implicit flow) or
    // exchange the code (PKCE flow)
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        router.push("/gate-7k9x?error=" + encodeURIComponent(error.message));
        return;
      }

      if (data.session) {
        router.push("/dashboard");
      } else {
        // No session yet - wait for onAuthStateChange
        // This handles implicit flow where tokens are in hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === "SIGNED_IN" && session) {
              subscription.unsubscribe();
              router.push("/dashboard");
            }
          }
        );

        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          router.push("/gate-7k9x?error=timeout");
        }, 5000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FAF7F2]/40 mx-auto mb-4" />
        <p className="text-[#FAF7F2]/40 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
