"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, BarChart2, Eye } from "lucide-react";

export default function LandingPage() {
  const { user, isLoaded } = useEdgeStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) router.push("/dashboard");
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] selection:bg-stone-200 font-sans">
      {/* Navigation */}
      <nav className="max-w-5xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="text-lg font-medium tracking-tight">
          EdgeTracker
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-stone-500 hover:text-stone-900 hover:bg-stone-100">
              Sign in
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-[#1C1917] text-white hover:bg-[#292524] rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-32">
        <div className="max-w-3xl">
          <p className="text-stone-400 text-sm font-medium tracking-wide uppercase mb-6">
            Trading Journal
          </p>

          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] text-[#1C1917] mb-8">
            Know when your
            <br />
            edge appears.
          </h1>

          <p className="text-xl text-stone-500 leading-relaxed mb-12 max-w-xl">
            Track the occurrence of your trading setups. Understand which days
            your edge shows up, and which days to step aside.
          </p>

          <Link href="/login">
            <Button size="lg" className="bg-[#1C1917] text-white hover:bg-[#292524] rounded-full px-8 py-6 text-base font-medium group">
              Start tracking
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
          <div className="p-8 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-6">
              <Calendar className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-lg font-medium mb-3">Daily Occurrence</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Log whether your setup appeared today. Track days with no setup to see the full picture.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-6">
              <BarChart2 className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-lg font-medium mb-3">Frequency Patterns</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              See which weekdays your edge appears most. Find your highest probability windows.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-6">
              <Eye className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-lg font-medium mb-3">Visual Snapshots</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Attach TradingView charts to your logs. Review setups at a glance without clicking through.
            </p>
          </div>
        </div>

        {/* Simple Stats Preview */}
        <div className="mt-32 p-12 rounded-3xl bg-white border border-stone-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-semibold text-[#1C1917]">72%</p>
              <p className="text-sm text-stone-400 mt-2">Occurrence rate</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-[#1C1917]">Tue</p>
              <p className="text-sm text-stone-400 mt-2">Most active day</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-[#1C1917]">3.2</p>
              <p className="text-sm text-stone-400 mt-2">Setups per week</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-[#1C1917]">24</p>
              <p className="text-sm text-stone-400 mt-2">Days tracked</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-sm text-stone-400">
          <span>EdgeTracker</span>
          <span>Built for ICT traders</span>
        </div>
      </footer>
    </div>
  );
}
