"use client";

import { useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Twitter, Copy, Check } from "lucide-react";
import { toPng } from "html-to-image";
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
      <DialogContent className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle
            className="text-xl text-[#0F0F0F] dark:text-white"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Share Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Card Preview */}
          <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div
              ref={cardRef}
              className="relative overflow-hidden"
              style={{
                width: "100%",
                background: "linear-gradient(145deg, #0F0F0F 0%, #1a1816 50%, #0F0F0F 100%)",
              }}
            >
              {/* Decorative Elements */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
                style={{
                  background: "radial-gradient(circle, #C45A3B 0%, transparent 70%)",
                  filter: "blur(40px)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15"
                style={{
                  background: "radial-gradient(circle, #8B9A7D 0%, transparent 70%)",
                  filter: "blur(30px)",
                  transform: "translate(-20%, 20%)",
                }}
              />

              {/* Content */}
              <div className="relative z-10 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C45A3B]/20 to-[#8B9A7D]/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <img src="/logo-icon-transparent.png" alt="" className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#FAF7F2]/40">
                      Edge of ICT
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#C45A3B]/10 border border-[#C45A3B]/20">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#C45A3B] font-medium">
                      Calendar P&L
                    </span>
                  </div>
                </div>

                {/* Month/Year */}
                <div className="mb-6">
                  <h2
                    className="text-3xl text-[#FAF7F2] tracking-tight leading-tight"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {monthName} {year}
                  </h2>
                  {title && (
                    <p className="text-sm text-[#FAF7F2]/30 mt-2">{title}</p>
                  )}
                </div>

                {/* Main Stats */}
                {monthStats.totalTrades > 0 ? (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#FAF7F2]/40 block mb-1">
                        P&L
                      </span>
                      <div
                        className={`text-2xl font-light ${
                          (monthStats.hasDollarPnL ? monthStats.dollarPnL! : monthStats.pointsPnL) >= 0
                            ? "text-[#8B9A7D]"
                            : "text-[#C45A3B]"
                        }`}
                        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                      >
                        {formatPnL(
                          monthStats.hasDollarPnL ? monthStats.dollarPnL! : monthStats.pointsPnL,
                          monthStats.hasDollarPnL
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#FAF7F2]/40 block mb-1">
                        Win Rate
                      </span>
                      <div
                        className={`text-2xl font-light ${
                          monthStats.winRate >= 50 ? "text-[#8B9A7D]" : "text-[#C45A3B]"
                        }`}
                        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                      >
                        {monthStats.winRate}%
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#FAF7F2]/40 block mb-1">
                        Trades
                      </span>
                      <div
                        className="text-2xl font-light text-[#FAF7F2]"
                        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                      >
                        {monthStats.totalTrades}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-sm text-[#FAF7F2]/40">No trades this month</span>
                  </div>
                )}

                {/* Mini Calendar Grid */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {WEEKDAY_HEADERS.map((day, idx) => (
                      <div
                        key={idx}
                        className="text-center text-[9px] text-[#FAF7F2]/30 uppercase"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {gridDays.map(({ date, isCurrentMonth }) => {
                      const dayNumber = parseInt(date.split("-")[2], 10);
                      const dayData = daysByDate.get(date);
                      const hasTrade = dayData && dayData.tradeCount > 0;
                      const weekend = isWeekend(date);

                      return (
                        <div
                          key={date}
                          className={`
                            aspect-square flex items-center justify-center text-[9px] rounded
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
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                  <span className="text-[10px] text-[#FAF7F2]/20 tracking-wider">
                    edgeofict.com
                  </span>
                  <span className="text-[10px] text-[#FAF7F2]/20">
                    Built for ICT traders
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] py-3 rounded-full text-sm font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Generating..." : "Download"}
            </button>

            <button
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 bg-[#0F0F0F]/10 dark:bg-white/10 text-[#0F0F0F] dark:text-white px-4 py-3 rounded-full text-sm font-medium hover:bg-[#0F0F0F]/20 dark:hover:bg-white/20 transition-colors"
              title="Copy image"
            >
              {copied ? <Check className="w-4 h-4 text-[#8B9A7D]" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleShareX}
              className="flex items-center justify-center gap-2 bg-[#0F0F0F]/10 dark:bg-white/10 text-[#0F0F0F] dark:text-white px-4 py-3 rounded-full text-sm font-medium hover:bg-[#0F0F0F]/20 dark:hover:bg-white/20 transition-colors"
              title="Share on X"
            >
              <Twitter className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-xs text-[#0F0F0F]/40 dark:text-white/40 mt-4">
            {copied
              ? "Image copied! Paste (Cmd+V) in your tweet to attach it"
              : "Click X button to copy image & open tweet composer"
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
