"use client";

import { useState, useMemo } from "react";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";

export function TrialBanner() {
  const { subscription } = useEdgeStore();
  const [dismissed, setDismissed] = useState(false);

  const daysLeft = useMemo(() => {
    if (!subscription || subscription.tier !== 'trial' || !subscription.trialEndsAt) {
      return null;
    }
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const diffMs = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [subscription]);

  if (dismissed || daysLeft === null) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-[#C45A3B]/10 via-[#C45A3B]/5 to-[#8B9A7D]/10 border-b border-[#C45A3B]/20 dark:border-[#C45A3B]/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Sparkles className="w-4 h-4 text-[#C45A3B] shrink-0" />
          <p className="text-xs sm:text-sm text-[#0F0F0F]/70 dark:text-white/70 truncate">
            <span className="font-medium text-[#C45A3B]">
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </span>
            {' '}on your free trial.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/pricing"
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-1.5 bg-[#C45A3B] text-white text-xs sm:text-sm font-medium rounded-full hover:bg-[#C45A3B]/90 transition-colors"
          >
            Upgrade
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-2.5 rounded-full text-[#0F0F0F]/45 dark:text-white/45 hover:text-[#0F0F0F]/60 dark:hover:text-white/60 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
