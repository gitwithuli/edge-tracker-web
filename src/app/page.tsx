"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function CandlestickChart() {
  const candles = [
    { open: 45, close: 62, high: 68, low: 40, bullish: true },
    { open: 62, close: 55, high: 65, low: 50, bullish: false },
    { open: 55, close: 70, high: 75, low: 52, bullish: true },
    { open: 70, close: 58, high: 72, low: 55, bullish: false },
    { open: 58, close: 78, high: 82, low: 55, bullish: true },
    { open: 78, close: 72, high: 80, low: 68, bullish: false },
    { open: 72, close: 85, high: 90, low: 70, bullish: true },
  ];

  return (
    <svg viewBox="0 0 280 120" className="w-full h-full">
      {candles.map((candle, i) => {
        const x = 20 + i * 38;
        const wickTop = 100 - candle.high;
        const wickBottom = 100 - candle.low;
        const bodyTop = 100 - Math.max(candle.open, candle.close);
        const bodyHeight = Math.abs(candle.close - candle.open);

        return (
          <g
            key={i}
            className="opacity-0 animate-[fadeSlideUp_0.6s_ease-out_forwards]"
            style={{ animationDelay: `${0.8 + i * 0.12}s` }}
          >
            <line
              x1={x + 8}
              y1={wickTop}
              x2={x + 8}
              y2={wickBottom}
              stroke={candle.bullish ? "#8B9A7D" : "#C45A3B"}
              strokeWidth="1.5"
            />
            <rect
              x={x}
              y={bodyTop}
              width="16"
              height={Math.max(bodyHeight, 2)}
              fill={candle.bullish ? "#8B9A7D" : "#C45A3B"}
              rx="1"
            />
          </g>
        );
      })}
    </svg>
  );
}

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

export default function LandingPage() {
  const { user, isLoaded } = useEdgeStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoaded && user) router.push("/dashboard");
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes expandWidth {
          from { width: 0; }
          to { width: 100%; }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen bg-[#FAF7F2] text-[#0F0F0F] selection:bg-[#C45A3B]/20 overflow-x-hidden">
        {/* Navigation */}
        <nav
          className={`max-w-6xl mx-auto px-6 sm:px-8 py-6 sm:py-8 flex justify-between items-center opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
          style={{ animationDelay: '0.1s' }}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo-icon-transparent.png" alt="Edge of ICT" className="w-20 h-20" />
            <span
              className="text-sm tracking-[0.08em] font-medium"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              EDGE <span className="text-[#0F0F0F]/40 text-xs">OF</span> ICT
            </span>
          </Link>
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/login"
              className="text-sm text-[#0F0F0F]/60 hover:text-[#0F0F0F] transition-colors duration-300"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-sm bg-[#0F0F0F] text-[#FAF7F2] px-5 py-2.5 rounded-full hover:bg-[#0F0F0F]/80 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-6 sm:px-8 pt-12 sm:pt-20 pb-24 sm:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            {/* Left Column - Typography */}
            <div className="lg:col-span-7 space-y-8">
              <p
                className={`text-[#C45A3B] text-xs tracking-[0.3em] uppercase font-medium opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.2s' }}
              >
                Trading Journal
              </p>

              <h1
                className={`text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.95] tracking-[-0.03em] font-normal opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  animationDelay: '0.3s'
                }}
              >
                Know when
                <br />
                <span className="italic text-[#0F0F0F]/70">your edge</span>
                <br />
                appears.
              </h1>

              <div
                className={`h-px bg-[#0F0F0F]/10 w-24 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.5s' }}
              />

              <p
                className={`text-lg sm:text-xl text-[#0F0F0F]/50 leading-relaxed max-w-md opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.6s' }}
              >
                Track the rhythm of your setups. Understand which days your edge materializes—and which days to step aside.
              </p>

              <Link
                href="/login"
                className={`inline-flex items-center gap-3 text-sm font-medium group opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.7s' }}
              >
                <span className="bg-[#0F0F0F] text-[#FAF7F2] px-6 py-3.5 rounded-full group-hover:bg-[#C45A3B] transition-colors duration-500">
                  Begin tracking
                </span>
                <span className="w-10 h-10 rounded-full border border-[#0F0F0F]/20 flex items-center justify-center group-hover:border-[#C45A3B] group-hover:bg-[#C45A3B]/10 transition-all duration-500">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </span>
              </Link>
            </div>

            {/* Right Column - Chart Visualization */}
            <div
              className={`lg:col-span-5 lg:pt-16 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
              style={{ animationDelay: '0.5s' }}
            >
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-br from-[#C45A3B]/5 to-transparent rounded-3xl" />
                <div className="relative bg-[#0F0F0F] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#0F0F0F]/10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[#FAF7F2]/40 text-xs tracking-wider uppercase">This Week</span>
                    <span className="text-[#8B9A7D] text-xs font-medium">+12.4%</span>
                  </div>
                  <div className="h-32 sm:h-40">
                    <CandlestickChart />
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#FAF7F2]/10 flex justify-between text-xs text-[#FAF7F2]/30">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div
            className={`mt-32 sm:mt-40 grid sm:grid-cols-3 gap-px bg-[#0F0F0F]/10 rounded-2xl overflow-hidden opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '1s' }}
          >
            {[
              {
                number: "01",
                title: "Daily Occurrence",
                description: "Log whether your setup appeared. Track no-setup days for the complete picture."
              },
              {
                number: "02",
                title: "Frequency Patterns",
                description: "Discover which weekdays your edge appears most. Find your probability windows."
              },
              {
                number: "03",
                title: "Visual Archive",
                description: "Attach TradingView snapshots. Review setups at a glance without clicking through."
              }
            ].map((feature, i) => (
              <div
                key={feature.number}
                className="bg-[#FAF7F2] p-8 sm:p-10 hover:bg-[#F5F0E8] transition-colors duration-500"
              >
                <span className="text-[#C45A3B] text-xs tracking-wider">{feature.number}</span>
                <h3
                  className="text-xl sm:text-2xl mt-4 mb-3 tracking-tight"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm text-[#0F0F0F]/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div
            className={`mt-24 sm:mt-32 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '1.2s' }}
          >
            <div className="flex items-center gap-4 mb-12">
              <span className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40">Sample Analytics</span>
              <div className="flex-1 h-px bg-[#0F0F0F]/10" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
              {[
                { value: "72%", label: "Occurrence Rate" },
                { value: "Tue", label: "Peak Day" },
                { value: "3.2", label: "Weekly Average" },
                { value: "24", label: "Days Tracked" }
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <p
                    className="text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#0F0F0F]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs tracking-wider uppercase text-[#0F0F0F]/40">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#0F0F0F]/10 py-8">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#0F0F0F]/40">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase"><img src="/logo-icon-transparent.png" alt="" className="w-5 h-5" />Edge of ICT</span>
            <span>Built for ICT traders</span>
          </div>
        </footer>
      </div>
    </>
  );
}
