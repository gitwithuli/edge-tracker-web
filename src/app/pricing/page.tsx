"use client";

import { useState, useEffect } from "react";
import { GrainOverlay } from "@/components/grain-overlay";
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SubscriptionTier } from "@/lib/types";

interface PricingTier {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const tiers: PricingTier[] = [
  {
    id: "retail",
    name: "Retail",
    tagline: "Start your journey",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "1 edge to track",
      "30-day data retention",
      "Basic journaling",
      "Performance stats",
    ],
    cta: "Get Started Free",
  },
  {
    id: "trader",
    name: "Trader",
    tagline: "For the serious practitioner",
    priceMonthly: 9,
    priceYearly: 90,
    features: [
      "Unlimited edges",
      "Unlimited data retention",
      "Macro Journal",
      "Backtest mode",
      "Advanced analytics",
      "Data export",
    ],
    highlighted: true,
    cta: "Upgrade to Trader",
  },
  {
    id: "inner_circle",
    name: "Inner Circle",
    tagline: "The complete arsenal",
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      "Everything in Trader",
      "AI Screenshot Parser",
      "Voice journal analysis",
      "AI trading summaries",
      "Priority support",
      "Early access to features",
    ],
    cta: "Join Inner Circle",
  },
];

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === "retail") {
      router.push("/dashboard");
      return;
    }

    setLoadingTier(tier);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, yearly }),
      });

      const data = await response.json();

      if (data.mock) {
        router.push(data.redirectUrl || "/dashboard?upgraded=true");
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        console.error("Checkout error:", data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingTier(null);
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

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen bg-[#0F0F0F] text-white relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#C45A3B]/10 rounded-full blur-[200px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-24">
          {/* Header */}
          <div className="text-center mb-16">
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-8 opacity-0 ${mounted ? "animate-fade-in" : ""}`}
              style={{ animationDelay: "0.1s" }}
            >
              ← Back to Dashboard
            </Link>

            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                animationDelay: "0.2s",
              }}
            >
              Choose your <span className="italic text-[#C45A3B]">edge.</span>
            </h1>

            <p
              className={`text-lg text-white/50 max-w-xl mx-auto mb-10 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
              style={{ animationDelay: "0.3s" }}
            >
              Every tier unlocks more tools to sharpen your trading. Start free,
              upgrade when you're ready.
            </p>

            {/* Billing toggle */}
            <div
              className={`inline-flex items-center gap-4 bg-white/5 rounded-full p-1.5 opacity-0 ${mounted ? "animate-slide-up" : ""}`}
              style={{ animationDelay: "0.4s" }}
            >
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !yearly
                    ? "bg-[#C45A3B] text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  yearly
                    ? "bg-[#C45A3B] text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Yearly
                <span className="text-xs bg-[#8B9A7D]/30 text-[#8B9A7D] px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-8 opacity-0 ${mounted ? "animate-slide-up" : ""} ${
                  tier.highlighted
                    ? "bg-gradient-to-b from-[#C45A3B]/20 to-transparent border-2 border-[#C45A3B]/50"
                    : "bg-white/5 border border-white/10"
                }`}
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-[#C45A3B] text-white text-xs font-medium px-4 py-1.5 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className="text-2xl mb-1"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-sm text-white/40">{tier.tagline}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold">
                      ${yearly ? tier.priceYearly : tier.priceMonthly}
                    </span>
                    {tier.priceMonthly > 0 && (
                      <span className="text-white/40">
                        /{yearly ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  {tier.priceMonthly === 0 && (
                    <p className="text-sm text-white/40 mt-1">Free forever</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-white/70"
                    >
                      <Check className="w-4 h-4 text-[#8B9A7D] mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loadingTier !== null}
                  className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    tier.highlighted
                      ? "bg-[#C45A3B] text-white hover:bg-[#C45A3B]/90"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {loadingTier === tier.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ or trust badges could go here */}
          <div
            className={`text-center mt-16 opacity-0 ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.9s" }}
          >
            <p className="text-sm text-white/30">
              Questions?{" "}
              <a
                href="mailto:support@edgeofict.com"
                className="text-[#C45A3B] hover:underline"
              >
                Contact us
              </a>
            </p>
          </div>

          {/* Footer */}
          <p
            className={`mt-20 text-center text-xs text-white/20 tracking-wider uppercase opacity-0 ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "1s" }}
          >
            Edge of ICT
          </p>
        </div>
      </div>
    </>
  );
}
