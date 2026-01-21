"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, ArrowRight } from "lucide-react";
import type { SubscriptionTier } from "@/lib/types";

interface UpgradePromptProps {
  feature: string;
  requiredTier: "trader" | "inner_circle";
  currentTier?: SubscriptionTier;
  variant?: "inline" | "card" | "modal";
  className?: string;
}

const TIER_NAMES: Record<SubscriptionTier, string> = {
  retail: "Retail",
  trader: "Trader",
  inner_circle: "Inner Circle",
};

const TIER_FEATURES: Record<"trader" | "inner_circle", string[]> = {
  trader: [
    "Unlimited edges",
    "Unlimited data retention",
    "Macro Journal",
    "Backtest mode",
  ],
  inner_circle: [
    "AI Screenshot Parser",
    "Voice journal analysis",
    "AI trading summaries",
    "Priority support",
  ],
};

export function UpgradePrompt({
  feature,
  requiredTier,
  currentTier = "retail",
  variant = "inline",
  className = "",
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg bg-[#C45A3B]/10 border border-[#C45A3B]/20 ${className}`}>
        <Lock className="w-5 h-5 text-[#C45A3B] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {feature} requires {TIER_NAMES[requiredTier]}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upgrade to unlock this feature
          </p>
        </div>
        <Button
          onClick={handleUpgrade}
          size="sm"
          className="bg-[#C45A3B] hover:bg-[#C45A3B]/90 text-white shrink-0"
        >
          Upgrade
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`rounded-xl border border-[#C45A3B]/20 bg-gradient-to-b from-[#C45A3B]/5 to-transparent p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#C45A3B]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#C45A3B]" />
          </div>
          <div>
            <h3 className="font-medium">Unlock {feature}</h3>
            <p className="text-sm text-muted-foreground">
              Available with {TIER_NAMES[requiredTier]}
            </p>
          </div>
        </div>

        <ul className="space-y-2 mb-6">
          {TIER_FEATURES[requiredTier].map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B9A7D]" />
              {feat}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          className="w-full bg-[#C45A3B] hover:bg-[#C45A3B]/90 text-white"
        >
          Upgrade to {TIER_NAMES[requiredTier]}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Modal variant - for use in dialogs
  return (
    <div className={`text-center py-8 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[#C45A3B]/20 flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-[#C45A3B]" />
      </div>

      <h3
        className="text-2xl mb-2"
        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
      >
        {feature}
      </h3>
      <p className="text-muted-foreground mb-6">
        This feature is available with {TIER_NAMES[requiredTier]} and above.
        {currentTier === "retail" && requiredTier === "inner_circle" && (
          <span className="block mt-1">
            You're currently on the {TIER_NAMES[currentTier]} plan.
          </span>
        )}
      </p>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleUpgrade}
          className="bg-[#C45A3B] hover:bg-[#C45A3B]/90 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to {TIER_NAMES[requiredTier]}
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>
          Maybe later
        </Button>
      </div>
    </div>
  );
}
