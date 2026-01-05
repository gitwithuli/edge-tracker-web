"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronRight, BarChart3, Target, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const { user, isLoaded } = useEdgeStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) router.push("/dashboard");
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-zinc-800 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(24,24,27,1)_0%,rgba(0,0,0,1)_100%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-zinc-900/50">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
           <TrendingUp className="w-6 h-6 text-white" /> EdgeTracker <span className="text-zinc-500">V2</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
              Login
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-zinc-200 hover:text-black font-bold px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-48 text-center">
        <div className="space-y-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest animate-fade-in">
             <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
             The Standard for ICT Traders
          </div>
          
          <h1 className="text-7xl md:text-[120px] font-extrabold tracking-tighter leading-[0.9] bg-gradient-to-b from-white via-white to-zinc-700 bg-clip-text text-transparent pb-4">
            Track Your Edge <br/> With Surgical Precision.
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A dynamic journaling system built specifically for SMC enthusiasts. Track RTH Gaps, Silver Bullets, and FVG models across Backtesting and Forward Testing.
          </p>
          
          <div className="flex justify-center pt-8">
            <Link href="/login">
              <Button size="lg" className="px-12 py-8 text-lg bg-white text-black hover:bg-zinc-200 hover:text-black rounded-2xl transition-all font-bold hover:scale-[1.02] active:scale-95 shadow-2xl">
                Start Your Journal <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-40">
           <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors text-left group">
              <Target className="w-8 h-8 mb-4 text-zinc-500 group-hover:text-white transition-colors" />
              <h3 className="text-lg font-bold mb-2">Model Specific</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Dedicated tracking for ICT models including Silver Bullets and RTH Gaps.</p>
           </div>
           <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors text-left group">
              <BarChart3 className="w-8 h-8 mb-4 text-zinc-500 group-hover:text-white transition-colors" />
              <h3 className="text-lg font-bold mb-2">Dual Performance</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Compare your Backtest data against live Forward Testing results instantly.</p>
           </div>
           <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors text-left group">
              <ShieldCheck className="w-8 h-8 mb-4 text-zinc-500 group-hover:text-white transition-colors" />
              <h3 className="text-lg font-bold mb-2">Clean Metrics</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Filter logs by day, duration, or result to find your highest probability setups.</p>
           </div>
        </div>
      </main>
    </div>
  );
}