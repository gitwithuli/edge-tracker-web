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

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/edgeofict/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C45A3B] transition-colors duration-300"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://x.com/edgeofict"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C45A3B] transition-colors duration-300"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61586670905754"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C45A3B] transition-colors duration-300"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.youtube.com/channel/UCLdMbS5oBGZ3ZVHEZ7_rvwQ"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C45A3B] transition-colors duration-300"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>

            <span>Track your edge. Master your timing.</span>
          </div>
        </footer>
      </div>
    </>
  );
}
