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
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex justify-between items-center">
        <div className="text-base sm:text-lg font-medium tracking-tight">
          EdgeTracker
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 text-sm sm:text-base px-3 sm:px-4">
              Sign in
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-[#1C1917] text-white hover:bg-[#292524] rounded-full px-4 sm:px-6 text-sm sm:text-base">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32">
        <div className="max-w-3xl">
          <p className="text-stone-400 text-xs sm:text-sm font-medium tracking-wide uppercase mb-4 sm:mb-6">
            Trading Journal
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] text-[#1C1917] mb-6 sm:mb-8">
            Know when your
            <br />
            edge appears.
          </h1>

          <p className="text-base sm:text-xl text-stone-500 leading-relaxed mb-8 sm:mb-12 max-w-xl">
            Track the occurrence of your trading setups. Understand which days
            your edge shows up, and which days to step aside.
          </p>

          <Link href="/login">
            <Button size="lg" className="bg-[#1C1917] text-white hover:bg-[#292524] rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium group">
              Start tracking
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-16 sm:mt-32">
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-4 sm:mb-6">
              <Calendar className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Daily Occurrence</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Log whether your setup appeared today. Track days with no setup to see the full picture.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-4 sm:mb-6">
              <BarChart2 className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Frequency Patterns</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              See which weekdays your edge appears most. Find your highest probability windows.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-4 sm:mb-6">
              <Eye className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Visual Snapshots</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Attach TradingView charts to your logs. Review setups at a glance without clicking through.
            </p>
          </div>
        </div>

        {/* Simple Stats Preview */}
        <div className="mt-16 sm:mt-32 p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-stone-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <p className="text-2xl sm:text-4xl font-semibold text-[#1C1917]">72%</p>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 sm:mt-2">Occurrence rate</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-semibold text-[#1C1917]">Tue</p>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 sm:mt-2">Most active day</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-semibold text-[#1C1917]">3.2</p>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 sm:mt-2">Setups per week</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-semibold text-[#1C1917]">24</p>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 sm:mt-2">Days tracked</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 text-xs sm:text-sm text-stone-400">
          <span>EdgeTracker</span>
          <span>Built for ICT traders</span>
        </div>
      </footer>
    </div>
  );
}
