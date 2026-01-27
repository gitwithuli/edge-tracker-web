"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Download, Twitter, Copy, Check } from "lucide-react";
import { toPng } from "html-to-image";

interface ShareCardDialogProps {
  edge: {
    name: string;
    description?: string;
  };
  stats: {
    winRate: number;
    occurrenceRate: number;
    wins: number;
    losses: number;
    totalLogs: number;
    bestDay: { day: string; occurred: number; total: number } | null;
    dayOccurrences: Record<string, { occurred: number; total: number }>;
  };
  trigger: React.ReactNode;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function ShareCardDialog({ edge, stats, trigger }: ShareCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
      a.download = `${edge.name.replace(/\s+/g, "-").toLowerCase()}-stats.png`;
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${edge.name.replace(/\s+/g, "-").toLowerCase()}-stats.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const text = `My ${edge.name} edge performance:\n📊 ${stats.winRate}% win rate\n🎯 ${stats.occurrenceRate}% occurrence rate\n\nTracking with @EdgeOfICT`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const maxOccurrenceRate = Math.max(
    ...DAYS.map(day => {
      const data = stats.dayOccurrences[day] || { occurred: 0, total: 0 };
      return data.total > 0 ? (data.occurred / data.total) * 100 : 0;
    }),
    1
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle
            className="text-xl text-[#0F0F0F] dark:text-white"
            style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
          >
            Share Your Edge
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
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C45A3B]/20 to-[#8B9A7D]/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <Image src="/logo-icon-transparent.png" alt="" width={20} height={20} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#FAF7F2]/40">
                      Edge of ICT
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#C45A3B]/10 border border-[#C45A3B]/20">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#C45A3B] font-medium">
                      Edge Stats
                    </span>
                  </div>
                </div>

                {/* Edge Name */}
                <div className="mb-8">
                  <h2
                    className="text-3xl text-[#FAF7F2] tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                  >
                    {edge.name}
                  </h2>
                  {stats.totalLogs > 0 && (
                    <p className="text-sm text-[#FAF7F2]/30 mt-2">
                      {stats.totalLogs} days tracked
                    </p>
                  )}
                </div>

                {/* Main Stats - Two Big Numbers */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8B9A7D]/10 to-transparent rounded-2xl" />
                    <div className="relative p-5 rounded-2xl border border-[#8B9A7D]/20">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#8B9A7D] block mb-2">
                        Win Rate
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-5xl font-light text-[#FAF7F2]"
                          style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                        >
                          {stats.winRate}
                        </span>
                        <span className="text-2xl text-[#FAF7F2]/40">%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-[#8B9A7D]">{stats.wins}W</span>
                        <span className="text-[#FAF7F2]/20">/</span>
                        <span className="text-sm text-[#C45A3B]">{stats.losses}L</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#C45A3B]/10 to-transparent rounded-2xl" />
                    <div className="relative p-5 rounded-2xl border border-[#C45A3B]/20">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#C45A3B] block mb-2">
                        Occurrence
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-5xl font-light text-[#FAF7F2]"
                          style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                        >
                          {stats.occurrenceRate}
                        </span>
                        <span className="text-2xl text-[#FAF7F2]/40">%</span>
                      </div>
                      <p className="text-sm text-[#FAF7F2]/30 mt-2">
                        setup appeared
                      </p>
                    </div>
                  </div>
                </div>

                {/* Day Distribution Chart */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#FAF7F2]/40">
                      Occurrence by Day
                    </span>
                    {stats.bestDay && (
                      <span className="text-[10px] text-[#C45A3B]">
                        Peak: {stats.bestDay.day.slice(0, 3)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2 h-16">
                    {DAYS.map((day) => {
                      const data = stats.dayOccurrences[day] || { occurred: 0, total: 0 };
                      const rate = data.total > 0 ? (data.occurred / data.total) * 100 : 0;
                      const normalizedHeight = maxOccurrenceRate > 0 ? (rate / maxOccurrenceRate) * 100 : 0;
                      const isBest = stats.bestDay?.day === day;
                      const hasData = data.total > 0;

                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full h-12 flex items-end">
                            <div
                              className={`w-full rounded-t-sm transition-all ${
                                isBest
                                  ? "bg-gradient-to-t from-[#C45A3B] to-[#C45A3B]/60"
                                  : hasData
                                    ? "bg-gradient-to-t from-[#8B9A7D] to-[#8B9A7D]/40"
                                    : "bg-white/10"
                              }`}
                              style={{ height: hasData ? `${Math.max(normalizedHeight, 8)}%` : "4px" }}
                            />
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider ${
                            isBest ? "text-[#C45A3B]" : "text-[#FAF7F2]/30"
                          }`}>
                            {day.slice(0, 1)}
                          </span>
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

          <p className="text-center text-xs text-[#0F0F0F]/50 dark:text-white/50 mt-4">
            Download the image and upload to X or Instagram
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
