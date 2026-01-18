"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle } from "lucide-react";

interface CountdownTimerProps {
  targetTime: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Passed";

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function CountdownTimer({ targetTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const target = new Date(targetTime).getTime();
    return target - Date.now();
  });

  useEffect(() => {
    const target = new Date(targetTime).getTime();

    const updateTime = () => {
      setTimeLeft(target - Date.now());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const isPast = timeLeft <= 0;
  const isImminent = timeLeft > 0 && timeLeft <= 15 * 60 * 1000;
  const isSoon = timeLeft > 15 * 60 * 1000 && timeLeft <= 60 * 60 * 1000;

  if (isPast) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[#0F0F0F]/30 dark:text-white/30">
        <CheckCircle className="w-3 h-3" />
        Passed
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${
        isImminent
          ? "bg-[#C45A3B]/10 text-[#C45A3B]"
          : isSoon
            ? "bg-[#D4A84B]/10 text-[#D4A84B]"
            : "bg-[#0F0F0F]/5 dark:bg-white/5 text-[#0F0F0F]/50 dark:text-white/50"
      }`}
    >
      <Clock className={`w-3 h-3 ${isImminent ? "animate-pulse" : ""}`} />
      {formatCountdown(timeLeft)}
    </span>
  );
}
