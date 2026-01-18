"use client";

import { useState, useEffect } from "react";
import { GrainOverlay } from "@/components/grain-overlay";
import { ArrowRight, Gift, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function SecretLoginPage() {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("LAUNCH50");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }

        .animate-pulse-subtle {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C45A3B]/20 rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-lg text-center">
          {/* Icon */}
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C45A3B]/20 mb-8 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
            style={{ animationDelay: "0.1s" }}
          >
            <Gift className="w-10 h-10 text-[#C45A3B] animate-pulse-subtle" />
          </div>

          {/* Headline */}
          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight mb-6 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              animationDelay: "0.2s",
            }}
          >
            You found the <span className="italic text-[#C45A3B]">secret door.</span>
          </h1>

          {/* Subtext */}
          <p
            className={`text-lg text-white/50 leading-relaxed mb-10 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
            style={{ animationDelay: "0.3s" }}
          >
            Most people wait on the landing page. But you went looking.
            <br className="hidden sm:block" />
            We respect that. Here's something special for you.
          </p>

          {/* Discount Code */}
          <div
            className={`opacity-0 ${mounted ? "animate-slide-up" : ""}`}
            style={{ animationDelay: "0.4s" }}
          >
            <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-3">
              Your exclusive launch discount
            </p>
            <button
              onClick={handleCopy}
              className="group inline-flex items-center gap-4 bg-white/5 border border-white/10 hover:border-[#C45A3B]/50 rounded-2xl px-8 py-5 transition-all duration-300"
            >
              <span
                className="text-2xl sm:text-3xl tracking-[0.15em] font-medium text-[#C45A3B]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                LAUNCH50
              </span>
              <span className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#C45A3B]/20 flex items-center justify-center transition-colors duration-300">
                {copied ? (
                  <Check className="w-5 h-5 text-[#8B9A7D]" />
                ) : (
                  <Copy className="w-5 h-5 text-white/40 group-hover:text-[#C45A3B]" />
                )}
              </span>
            </button>
            <p className="text-sm text-white/30 mt-3">
              {copied ? "Copied to clipboard!" : "Click to copy • 50% off at launch"}
            </p>
          </div>

          {/* CTA */}
          <div
            className={`mt-14 opacity-0 ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.6s" }}
          >
            <p className="text-sm text-white/40 mb-4">
              Want to know when we launch?
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors duration-300"
            >
              <span>Join the waitlist</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Footer */}
          <p
            className={`mt-20 text-xs text-white/20 tracking-wider uppercase opacity-0 ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.8s" }}
          >
            Edge of ICT
          </p>
        </div>
      </div>
    </>
  );
}
