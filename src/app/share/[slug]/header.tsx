"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SharePageHeader() {
  return (
    <header className="border-b border-[#0F0F0F]/5 dark:border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon-transparent.png" alt="Edge Tracker" width={32} height={32} className="w-8 h-8" />
          <span
            className="text-sm tracking-[0.08em] font-medium"
            style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
          >
            EDGE <span className="text-[#0F0F0F]/50 dark:text-white/50 text-xs">OF</span> ICT
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-4 py-2 rounded-full font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors"
          >
            Start Tracking
          </Link>
        </div>
      </div>
    </header>
  );
}
