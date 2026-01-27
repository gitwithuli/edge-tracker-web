"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { GrainOverlay } from "@/components/grain-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { Check, Clock, ArrowLeft, Loader2, Lock, Wallet, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const PAID_FEATURES = [
  { name: "Forwardtest Tracking", included: true },
  { name: "Backtest Logging", included: true },
  { name: "Macro Tracker", included: true },
  { name: "Unlimited Edges", included: true },
  { name: "TradingView Screenshots", included: true },
  { name: "Performance Analytics", included: true },
  { name: "Data Export", included: true },
  { name: "Calendar P&L View", included: true },
];

const FREE_FEATURES = [
  { name: "1 Edge (basic logging)", included: true },
  { name: "7-day rolling history", included: true },
  { name: "Forwardtest only", included: true },
];

const FREE_LIMITATIONS = [
  { name: "Backtest Logging", locked: true },
  { name: "Macro Tracker", locked: true },
  { name: "Data Export", locked: true },
  { name: "Unlimited Edges", locked: true },
];

const COMING_SOON = [
  { name: "AI Chart Parser" },
  { name: "Voice Journal" },
  { name: "AI Trade Summaries" },
];

const ACCEPTED_COINS = ["BTC", "ETH", "USDT", "USDC"];

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoaded, isPaid, subscription } = useEdgeStore();
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

  // Trial countdown
  const trialInfo = useMemo(() => {
    if (!subscription || subscription.tier !== 'trial' || !subscription.trialEndsAt) {
      return null;
    }
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const diffMs = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { daysLeft, trialEnd };
  }, [subscription]);

  const handleCryptoCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) {
        if (error === 'Already subscribed') {
          toast.success('You already have an active subscription!');
          router.push('/dashboard');
        } else {
          toast.error(error);
        }
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
        <Loader2 className="w-8 h-8 animate-spin text-[#0F0F0F]/50 dark:text-white/50" />
      </div>
    );
  }

  const isOnTrial = subscription?.tier === 'trial';
  const isOnFree = subscription?.tier === 'free' || subscription?.tier === 'unpaid';
  const isAlreadyPaid = subscription?.tier === 'paid';

  return (
    <>
      <GrainOverlay />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white selection:bg-[#C45A3B]/20 transition-colors duration-300">
        {/* Header */}
        <header className="border-b border-[#0F0F0F]/5 dark:border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link
              href={user ? "/dashboard" : "/"}
              className={`inline-flex items-center gap-2 text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white transition-colors text-sm opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="tracking-[0.15em] uppercase">Back</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Trial Banner */}
          {isOnTrial && trialInfo && (
            <div
              className={`mb-8 p-4 rounded-xl bg-[#C45A3B]/10 border border-[#C45A3B]/20 text-center opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              <p className="text-sm text-[#C45A3B] font-medium">
                Your trial ends in {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''}.
                Upgrade now to keep full access.
              </p>
            </div>
          )}

          {/* Free tier notice */}
          {isOnFree && (
            <div
              className={`mb-8 p-4 rounded-xl bg-[#0F0F0F]/5 dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10 text-center opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              <p className="text-sm text-[#0F0F0F]/60 dark:text-white/60">
                You&apos;re on the <span className="font-medium text-[#0F0F0F] dark:text-white">Free</span> plan.
                Upgrade to unlock unlimited edges, backtesting, macros, and more.
              </p>
            </div>
          )}

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
              style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
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

              {/* Free Trial Callout */}
              {!isOnTrial && (
                <div className="mb-6 p-3 rounded-xl bg-[#8B9A7D]/10 border border-[#8B9A7D]/20 text-center">
                  <p className="text-sm font-medium text-[#8B9A7D]">
                    Start with a 7-day free trial — full access, no payment required
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-[#0F0F0F]/50 dark:text-white/50 line-through text-xl">$29</span>
                  <span
                    className="text-4xl font-semibold"
                    style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                  >
                    $14.50
                  </span>
                  <span className="text-[#0F0F0F]/50 dark:text-white/50">/month</span>
                </div>
                <p className="text-[#0F0F0F]/50 dark:text-white/50 text-sm mt-1">
                  50% off for life — early adopters only
                </p>
              </div>

              {/* CTA */}
              {isAlreadyPaid ? (
                <Link
                  href="/dashboard"
                  className="w-full bg-[#8B9A7D] text-white py-3 rounded-full font-medium hover:bg-[#8B9A7D]/90 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  You&apos;re subscribed — Go to Dashboard
                </Link>
              ) : user ? (
                <button
                  onClick={handleCryptoCheckout}
                  disabled={loading}
                  className="w-full bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] py-3 rounded-full font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Pay with Crypto
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="w-full bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] py-3 rounded-full font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  Start Free Trial
                </Link>
              )}

              {/* Accepted coins */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {ACCEPTED_COINS.map((coin) => (
                  <span
                    key={coin}
                    className="px-2 py-0.5 text-[10px] font-medium tracking-wider bg-[#0F0F0F]/5 dark:bg-white/5 text-[#0F0F0F]/50 dark:text-white/50 rounded-full"
                  >
                    {coin}
                  </span>
                ))}
              </div>

              {/* Card payments note */}
              <p className="text-center text-[#0F0F0F]/50 dark:text-white/50 text-xs mt-3">
                Card payments coming soon
              </p>

              {/* Trial info */}
              {!user && (
                <p className="text-center text-[#0F0F0F]/50 dark:text-white/50 text-sm mt-4">
                  7-day free trial, then $14.50/mo. Cancel anytime.
                </p>
              )}

              {/* Paid Features */}
              <div className="mt-8 pt-8 border-t border-[#0F0F0F]/10 dark:border-white/10">
                <h3 className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/50 dark:text-white/50 mb-4">
                  What&apos;s included
                </h3>
                <ul className="space-y-3">
                  {PAID_FEATURES.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#8B9A7D]" />
                      <span className="text-sm">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Free Tier Comparison */}
              {isOnFree && (
                <div className="mt-6 pt-6 border-t border-[#0F0F0F]/10 dark:border-white/10">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/50 dark:text-white/50 mb-4">
                    Your current free plan
                  </h3>
                  <ul className="space-y-3">
                    {FREE_FEATURES.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-3 text-[#0F0F0F]/50 dark:text-white/50">
                        <Check className="w-4 h-4 text-[#0F0F0F]/45 dark:text-white/45" />
                        <span className="text-sm">{feature.name}</span>
                      </li>
                    ))}
                    {FREE_LIMITATIONS.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-3 text-[#0F0F0F]/45 dark:text-white/45">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm line-through">{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coming Soon */}
              <div className="mt-6 pt-6 border-t border-[#0F0F0F]/10 dark:border-white/10">
                <h3 className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/50 dark:text-white/50 mb-4">
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
            <p className="text-[#0F0F0F]/50 dark:text-white/50 text-sm">
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
