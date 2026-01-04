"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, Shield, Zap, TrendingUp, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 font-sans">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-zinc-900">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
           <TrendingUp className="w-6 h-6 text-zinc-100" /> EdgeTracker V2
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white transition-colors">
              Login
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-zinc-200 font-semibold px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm mb-4 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Now supporting custom ICT models
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Track Your Edge <br/> With Surgical Precision.
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            The ultimate dynamic journal for SMC traders. Built specifically to track RTH Gaps, Silver Bullets, and FVG models across Backtesting and Forward Testing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto px-10 py-7 text-lg bg-white text-black hover:bg-zinc-200 rounded-xl transition-all hover:scale-105 active:scale-95">
                Start Your Journal <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40">
          <div className="group p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Striking UI</h3>
            <p className="text-zinc-500 leading-relaxed">
              Nomad-style Card UI designed for speed. Log market observations without breaking your flow during live sessions.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Dual Tracking</h3>
            <p className="text-zinc-500 leading-relaxed">
              Separate Forward and Backtesting data for the same model. Know exactly how your execution differs from your theory.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">SaaS Performance</h3>
            <p className="text-zinc-500 leading-relaxed">
              Built for 2026 trading standards. Cloud-synced, encrypted, and optimized for professional prop-firm preparation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
            © 2026 EdgeTracker Web. All rights reserved.
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}