"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const { user, isLoaded } = useEdgeStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) router.push("/dashboard");
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 font-sans">
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-zinc-900">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
           <TrendingUp className="w-6 h-6 text-zinc-100" /> EdgeTracker V2
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-900">Login</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-zinc-200 hover:text-black font-bold px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-8">
          Track Your Edge <br/> With Surgical Precision.
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-10">
          The ultimate dynamic journal for SMC traders. Built to track RTH Gaps, Silver Bullets, and FVG models.
        </p>
        <Link href="/login">
          <Button size="lg" className="px-10 py-7 text-lg bg-white text-black hover:bg-zinc-200 hover:text-black font-bold rounded-xl transition-all">
            Start Your Journal <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </main>
    </div>
  );
}