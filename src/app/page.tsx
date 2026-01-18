"use client";

import { useState, useEffect } from "react";
import { GrainOverlay } from "@/components/grain-overlay";
import { ArrowRight, Check, Loader2, Target, BarChart3, Calendar } from "lucide-react";

function FloatingCandles() {
  const candles = [
    { x: 10, delay: 0, bullish: true, height: 40 },
    { x: 25, delay: 0.3, bullish: false, height: 55 },
    { x: 40, delay: 0.6, bullish: true, height: 35 },
    { x: 55, delay: 0.9, bullish: true, height: 60 },
    { x: 70, delay: 1.2, bullish: false, height: 45 },
    { x: 85, delay: 1.5, bullish: true, height: 50 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {candles.map((candle, i) => (
        <div
          key={i}
          className="absolute opacity-0 animate-[floatUp_8s_ease-in-out_infinite]"
          style={{
            left: `${candle.x}%`,
            bottom: "-20%",
            animationDelay: `${candle.delay + i * 0.8}s`,
          }}
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-px ${candle.bullish ? "bg-[#8B9A7D]/20 dark:bg-[#8B9A7D]/10" : "bg-[#C45A3B]/20 dark:bg-[#C45A3B]/10"}`}
              style={{ height: `${candle.height * 0.3}px` }}
            />
            <div
              className={`w-3 rounded-sm ${candle.bullish ? "bg-[#8B9A7D]/15 dark:bg-[#8B9A7D]/8" : "bg-[#C45A3B]/15 dark:bg-[#C45A3B]/8"}`}
              style={{ height: `${candle.height}px` }}
            />
            <div
              className={`w-px ${candle.bullish ? "bg-[#8B9A7D]/20 dark:bg-[#8B9A7D]/10" : "bg-[#C45A3B]/20 dark:bg-[#C45A3B]/10"}`}
              style={{ height: `${candle.height * 0.4}px` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WaitlistPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "exists" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(data.alreadyExists ? "exists" : "success");
        if (!data.alreadyExists) setEmail("");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Connection failed. Please try again.");
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
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

        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-120vh);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white selection:bg-[#C45A3B]/20 overflow-hidden relative transition-colors duration-300">
        <FloatingCandles />

        {/* Navigation */}
        <nav
          className={`relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex justify-between items-center opacity-0 ${mounted ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/logo-icon-transparent.png"
              alt="Edge of ICT"
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
            />
            <span
              className="text-xs sm:text-sm tracking-[0.1em] font-medium"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              EDGE <span className="text-[#0F0F0F]/40 dark:text-white/40 text-[10px] sm:text-xs">OF</span> ICT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B9A7D] animate-pulse-slow" />
            <span className="text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#0F0F0F]/50 dark:text-white/50">
              Building
            </span>
          </div>
        </nav>

        {/* Hero */}
        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 lg:pt-24 pb-16 sm:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F0F0F]/5 dark:bg-white/5 mb-8 sm:mb-12 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
              style={{ animationDelay: "0.2s" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C45A3B]" />
              <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/60 dark:text-white/60">
                Coming Soon
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className={`text-[clamp(2.25rem,7vw,4.5rem)] leading-[1.05] tracking-[-0.02em] mb-6 sm:mb-8 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                animationDelay: "0.3s",
              }}
            >
              Track the <span className="italic text-[#0F0F0F]/60 dark:text-white/60">rhythm</span>
              <br className="hidden sm:block" />
              {" "}of your edge.
            </h1>

            {/* Subheadline */}
            <p
              className={`text-base sm:text-lg lg:text-xl text-[#0F0F0F]/50 dark:text-white/50 leading-relaxed max-w-xl mx-auto mb-10 sm:mb-14 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
              style={{ animationDelay: "0.4s" }}
            >
              Know which days your setups appear. Understand your probability windows.
              Stop guessing—start tracking.
            </p>

            {/* Email Form */}
            <div
              className={`opacity-0 ${mounted ? "animate-slide-up" : ""}`}
              style={{ animationDelay: "0.5s" }}
            >
              {status === "success" ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#8B9A7D]/10 dark:bg-[#8B9A7D]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#8B9A7D]" />
                  </div>
                  <div>
                    <p
                      className="text-xl sm:text-2xl mb-2"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      You&apos;re on the list.
                    </p>
                    <p className="text-sm text-[#0F0F0F]/50 dark:text-white/50">
                      We&apos;ll notify you the moment we launch.
                    </p>
                  </div>
                </div>
              ) : status === "exists" ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#C45A3B]/10 dark:bg-[#C45A3B]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#C45A3B]" />
                  </div>
                  <div>
                    <p
                      className="text-xl sm:text-2xl mb-2"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      Already on the list!
                    </p>
                    <p className="text-sm text-[#0F0F0F]/50 dark:text-white/50">
                      We haven&apos;t forgotten you. Launch is coming.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10 rounded-full text-sm placeholder:text-[#0F0F0F]/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#0F0F0F]/30 dark:focus:border-white/30 focus:ring-2 focus:ring-[#0F0F0F]/5 dark:focus:ring-white/5 transition-all duration-300"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-6 py-4 rounded-full text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-all duration-500 disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {status === "error" && (
                <p className="mt-4 text-sm text-[#C45A3B]">{errorMessage}</p>
              )}

              {status === "idle" && (
                <p className="mt-4 text-xs text-[#0F0F0F]/40 dark:text-white/40">
                  Be the first to know when we launch. No spam, ever.
                </p>
              )}
            </div>
          </div>

          {/* Feature Preview */}
          <div
            className={`mt-20 sm:mt-28 lg:mt-36 opacity-0 ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.8s" }}
          >
            <p className="text-center text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-10 sm:mb-14">
              What&apos;s Coming
            </p>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: Target,
                  title: "Track Occurrences",
                  description:
                    "Log whether your edge appeared each day. Build a real dataset of your setups.",
                },
                {
                  icon: BarChart3,
                  title: "Backtest Patterns",
                  description:
                    "Discover which days your edge shows up most. Find your probability windows.",
                },
                {
                  icon: Calendar,
                  title: "Visual Journal",
                  description:
                    "Attach charts. Add notes. Review your setups without digging through screenshots.",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="group p-6 sm:p-8 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-[#0F0F0F]/5 dark:border-white/5 hover:border-[#0F0F0F]/10 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-500"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0F0F0F]/5 dark:bg-white/5 flex items-center justify-center mb-5 group-hover:bg-[#C45A3B]/10 dark:group-hover:bg-[#C45A3B]/20 transition-colors duration-500">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0F0F0F]/40 dark:text-white/40 group-hover:text-[#C45A3B] transition-colors duration-500" />
                  </div>
                  <h3
                    className="text-base sm:text-lg mb-2 tracking-tight"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0F0F0F]/50 dark:text-white/50 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof Placeholder */}
          <div
            className={`mt-20 sm:mt-28 text-center opacity-0 ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "1s" }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-[#0F0F0F]/10 dark:border-white/10">
              <img
                src="/ict-fractal.jpg"
                alt="ICT"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-xs text-[#0F0F0F]/50 dark:text-white/50">
                Built for ICT traders, by ICT traders
              </span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-[#0F0F0F]/5 dark:border-white/5 py-6 sm:py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#0F0F0F]/40 dark:text-white/40">
            <span className="flex items-center gap-2 tracking-[0.15em] uppercase">
              <img src="/logo-icon-transparent.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
              Edge of ICT
            </span>
            <span>Track your edge. Master your timing.</span>
          </div>
        </footer>
      </div>
    </>
  );
}
