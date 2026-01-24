"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { GrainOverlay } from "@/components/grain-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { Check, Clock, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  { name: "Forwardtest Tracking", included: true },
  { name: "Backtest Logging", included: true },
  { name: "Macro Tracker", included: true },
  { name: "Unlimited Edges", included: true },
  { name: "TradingView Screenshots", included: true },
  { name: "Performance Analytics", included: true },
  { name: "Data Export", included: true },
];

const COMING_SOON = [
  { name: "AI Chart Parser", included: false },
  { name: "Voice Journal", included: false },
  { name: "AI Trade Summaries", included: false },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoaded, isPaid } = useEdgeStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If already paid, redirect to dashboard
  useEffect(() => {
    if (isLoaded && user && isPaid()) {
      router.push('/dashboard');
    }
  }, [isLoaded, user, isPaid, router]);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        setLoading(false);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/40 dark:text-white/40" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

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

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white selection:bg-[#C45A3B]/20 transition-colors duration-300">
        {/* Header */}
        <header className="border-b border-[#0F0F0F]/5 dark:border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link
              href={user ? "/dashboard" : "/"}
              className={`inline-flex items-center gap-2 text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white transition-colors text-sm opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="tracking-[0.15em] uppercase">Back</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Title Section */}
          <div
            className={`text-center mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <p className="text-[#C45A3B] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-3">
              Early Adopter Pricing
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Track your <span className="italic text-[#0F0F0F]/60 dark:text-white/60">edge</span>
            </h1>
            <p className="text-[#0F0F0F]/60 dark:text-white/60 max-w-md mx-auto">
              Join traders who understand that consistency comes from knowing when their setups truly appear.
            </p>
          </div>

          {/* Pricing Card */}
          <div
            className={`max-w-md mx-auto opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#0F0F0F]/10 dark:border-white/10 p-8 shadow-sm">
              {/* Badge */}
              <div className="flex justify-between items-start mb-6">
                <span className="inline-block px-3 py-1 bg-[#C45A3B]/10 text-[#C45A3B] text-xs font-medium tracking-wide rounded-full">
                  Limited: First 20 spots
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-[#0F0F0F]/40 dark:text-white/40 line-through text-xl">$29</span>
                  <span
                    className="text-4xl font-semibold"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    $14.50
                  </span>
                  <span className="text-[#0F0F0F]/40 dark:text-white/40">/month</span>
                </div>
                <p className="text-[#0F0F0F]/50 dark:text-white/50 text-sm mt-1">
                  50% off for life — early adopters only
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] py-3 rounded-full font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : user ? (
                  'Subscribe Now'
                ) : (
                  'Sign Up to Subscribe'
                )}
              </button>

              {/* Guarantee */}
              <p className="text-center text-[#0F0F0F]/50 dark:text-white/50 text-sm mt-4">
                7-day money-back guarantee. No questions asked.
              </p>

              {/* Features */}
              <div className="mt-8 pt-8 border-t border-[#0F0F0F]/10 dark:border-white/10">
                <h3 className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-4">
                  What&apos;s included
                </h3>
                <ul className="space-y-3">
                  {FEATURES.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#8B9A7D]" />
                      <span className="text-sm">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coming Soon */}
              <div className="mt-6 pt-6 border-t border-[#0F0F0F]/10 dark:border-white/10">
                <h3 className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-4">
                  Coming Soon
                </h3>
                <ul className="space-y-3">
                  {COMING_SOON.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3 text-[#0F0F0F]/50 dark:text-white/50">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ or additional info */}
          <div
            className={`mt-12 text-center opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '0.4s' }}
          >
            <p className="text-[#0F0F0F]/40 dark:text-white/40 text-sm">
              Questions? Email us at{' '}
              <a href="mailto:support@edgeofict.com" className="text-[#C45A3B] hover:underline">
                support@edgeofict.com
              </a>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
