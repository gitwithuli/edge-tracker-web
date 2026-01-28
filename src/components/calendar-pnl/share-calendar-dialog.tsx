"use client";

import { useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Download, Twitter, Copy, Check } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { TradeLog } from "@/lib/types";
import {
  calculateMonthPnL,
  getMonthName,
  formatPnL,
  getCalendarGridDays,
  aggregateLogsByDay,
  isWeekend,
} from "./calendar-utils";

interface ShareCalendarDialogProps {
  logs: TradeLog[];
  year: number;
  month: number;
  title?: string;
  trigger: React.ReactNode;
}

const WEEKDAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

export function ShareCalendarDialog({ logs, year, month, title, trigger }: ShareCalendarDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const monthStats = useMemo(
    () => calculateMonthPnL(logs, year, month),
    [logs, year, month]
  );

  const gridDays = useMemo(() => getCalendarGridDays(year, month), [year, month]);
  const daysByDate = useMemo(() => aggregateLogsByDay(logs), [logs]);

  const monthName = getMonthName(month);

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#0F0F0F",
        cacheBust: true,
      });

      return dataUrlToBlob(dataUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
      return null;
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    const blob = await generateImage();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calendar-pnl-${monthName.toLowerCase()}-${year}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const handleCopyImage = async () => {
    const blob = await generateImage();
    if (blob) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy image:", error);
        toast.error("Failed to copy image. Try downloading instead.");
      }
    }
  };

  const handleShareX = async () => {
    const blob = await generateImage();
    if (blob) {
      // Copy image to clipboard so user can paste it in the tweet
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (error) {
        // Fallback: download the image if clipboard fails
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `calendar-pnl-${monthName.toLowerCase()}-${year}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      const pnlText = monthStats.totalTrades > 0
        ? formatPnL(
            monthStats.hasDollarPnL ? monthStats.dollarPnL! : monthStats.pointsPnL,
            monthStats.hasDollarPnL
          )
        : "No trades";
      const text = `My ${monthName} ${year} trading performance:\n${pnlText} P&L across ${monthStats.tradingDays} trading days\n\nTracking with @EdgeOfICT`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // Get P&L color for a day cell
  const getDayPnLColor = (date: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return "";
    const dayData = daysByDate.get(date);
    if (!dayData || dayData.tradeCount === 0) return "";
    const pnl = dayData.hasDollarPnL ? dayData.dollarPnL! : dayData.pointsPnL;
    if (pnl > 0) return "bg-[#8B9A7D]/30";
    if (pnl < 0) return "bg-[#C45A3B]/30";
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 max-w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[90vh] sm:max-h-[85vh]">
        <DialogHeader className="p-3 sm:p-6 pb-0">
          <DialogTitle
            className="text-base sm:text-xl text-[#0F0F0F] dark:text-white"
            style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
          >
            Share Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 sm:p-6 overflow-y-auto">
          {/* Card Preview */}
          <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div
              ref={cardRef}
              className="relative overflow-hidden"
              style={{
                width: "100%",
                background: "linear-gradient(145deg, #0F0F0F 0%, #1a1816 50%, #0F0F0F 100%)",
              }}
            >
              {/* Decorative Elements - smaller on mobile */}
              <div
                className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 rounded-full opacity-20"
                style={{
                  background: "radial-gradient(circle, #C45A3B 0%, transparent 70%)",
                  filter: "blur(40px)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 rounded-full opacity-15"
                style={{
                  background: "radial-gradient(circle, #8B9A7D 0%, transparent 70%)",
                  filter: "blur(30px)",
                  transform: "translate(-20%, 20%)",
                }}
              />

              {/* Content - responsive padding */}
              <div className="relative z-10 p-4 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#C45A3B]/20 to-[#8B9A7D]/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <Image src="/logo-icon-transparent.png" alt="" width={20} height={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#FAF7F2]/40">
                      Edge of ICT
                    </span>
                  </div>
                  <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#C45A3B]/10 border border-[#C45A3B]/20">
                    <span className="text-[8px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[#C45A3B] font-medium">
                      Calendar P&L
                    </span>
                  </div>
                </div>

                {/* Month/Year */}
                <div className="mb-4 sm:mb-6">
                  <h2
                    className="text-xl sm:text-3xl text-[#FAF7F2] tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                  >
                    {monthName} {year}
                  </h2>
                  {title && (
                    <p className="text-xs sm:text-sm text-[#FAF7F2]/30 mt-1 sm:mt-2">{title}</p>
                  )}
                </div>

                {/* Main Stats */}
                {monthStats.totalTrades > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#FAF7F2]/40 block mb-0.5 sm:mb-1">
                        P&L
                      </span>
                      <div
                        className={`text-base sm:text-2xl font-light ${
                          (monthStats.hasDollarPnL ? monthStats.dollarPnL! : monthStats.pointsPnL) >= 0
                            ? "text-[#8B9A7D]"
                            : "text-[#C45A3B]"
                        }`}
                        style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                      >
                        {formatPnL(
                          monthStats.hasDollarPnL ? monthStats.dollarPnL! : monthStats.pointsPnL,
                          monthStats.hasDollarPnL
                        )}
                      </div>
                    </div>
                    <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#FAF7F2]/40 block mb-0.5 sm:mb-1">
                        Win Rate
                      </span>
                      <div
                        className={`text-base sm:text-2xl font-light ${
                          monthStats.winRate >= 50 ? "text-[#8B9A7D]" : "text-[#C45A3B]"
                        }`}
                        style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                      >
                        {monthStats.winRate}%
                      </div>
                    </div>
                    <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#FAF7F2]/40 block mb-0.5 sm:mb-1">
                        Trades
                      </span>
                      <div
                        className="text-base sm:text-2xl font-light text-[#FAF7F2]"
                        style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                      >
                        {monthStats.totalTrades}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs sm:text-sm text-[#FAF7F2]/40">No trades this month</span>
                  </div>
                )}

                {/* Mini Calendar Grid */}
                <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 mb-1 sm:mb-2">
                    {WEEKDAY_HEADERS.map((day, idx) => (
                      <div
                        key={idx}
                        className="text-center text-[7px] sm:text-[9px] text-[#FAF7F2]/30 uppercase"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {gridDays.map(({ date, isCurrentMonth }) => {
                      const dayNumber = parseInt(date.split("-")[2], 10);
                      const dayData = daysByDate.get(date);
                      const hasTrade = dayData && dayData.tradeCount > 0;
                      const weekend = isWeekend(date);

                      return (
                        <div
                          key={date}
                          className={`
                            aspect-square flex items-center justify-center text-[7px] sm:text-[9px] rounded
                            ${isCurrentMonth
                              ? hasTrade
                                ? getDayPnLColor(date, isCurrentMonth)
                                : weekend
                                  ? "text-[#FAF7F2]/20"
                                  : "text-[#FAF7F2]/40"
                              : "text-[#FAF7F2]/10"
                            }
                          `}
                        >
                          {dayNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5">
                  <span className="text-[8px] sm:text-[10px] text-[#FAF7F2]/20 tracking-wider">
                    edgeofict.com
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-[#FAF7F2]/20">
                    Built for ICT traders
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A3B] focus-visible:ring-offset-2"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              {downloading ? "..." : "Download"}
            </button>

            <button
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 bg-[#0F0F0F]/10 dark:bg-white/10 text-[#0F0F0F] dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-full text-sm font-medium hover:bg-[#0F0F0F]/20 dark:hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A3B] focus-visible:ring-offset-2"
              title="Copy image"
              aria-label="Copy image to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8B9A7D]" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />}
            </button>

            <button
              onClick={handleShareX}
              className="flex items-center justify-center gap-2 bg-[#0F0F0F]/10 dark:bg-white/10 text-[#0F0F0F] dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-full text-sm font-medium hover:bg-[#0F0F0F]/20 dark:hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A3B] focus-visible:ring-offset-2"
              title="Share on X"
              aria-label="Share on X (Twitter)"
            >
              <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </button>
          </div>

          <p className="text-center text-[10px] sm:text-xs text-[#0F0F0F]/50 dark:text-white/50 mt-3 sm:mt-4">
            {copied
              ? "Image copied! Paste in your tweet"
              : "Tap X to copy image & open tweet"
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
