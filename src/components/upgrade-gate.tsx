"use client";

import { useEdgeStore } from "@/hooks/use-edge-store";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { Feature } from "@/lib/types";

interface UpgradeGateProps {
  feature: Feature;
  children: React.ReactNode;
  /** Inline mode shows a small lock badge instead of full overlay */
  inline?: boolean;
  /** Custom message to display */
  message?: string;
}

export function UpgradeGate({
  feature,
  children,
  inline = false,
  message,
}: UpgradeGateProps) {
  const { canAccess } = useEdgeStore();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F0F0F]/5 dark:bg-white/5 text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#C45A3B] dark:hover:text-[#C45A3B] transition-colors text-xs font-medium"
      >
        <Lock className="w-3 h-3" />
        {message || "Upgrade"}
      </Link>
    );
  }

  return (
    <div className="relative">
      {/* Blurred content behind the gate */}
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF7F2]/60 dark:bg-[#0F0F0F]/60 backdrop-blur-[1px] rounded-xl">
        <div className="flex flex-col items-center gap-3 p-6">
          <div className="w-10 h-10 rounded-full bg-[#0F0F0F]/5 dark:bg-white/5 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#0F0F0F]/50 dark:text-white/50" />
          </div>
          <p className="text-sm text-[#0F0F0F]/60 dark:text-white/60 text-center max-w-xs">
            {message || "Upgrade to access this feature"}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-5 py-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] text-sm font-medium rounded-full hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}
