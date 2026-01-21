"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useEdgeStore } from "@/hooks/use-edge-store";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  Save,
  Zap,
  TrendingUp,
  History,
} from "lucide-react";
import Link from "next/link";
import type { ParsedChartData, ChartParseResponse } from "@/lib/types";
import { isTradingViewUrl } from "@/lib/tradingview";
import { cn } from "@/lib/utils";

type UploadMode = "file" | "url";
type LogType = "FRONTTEST" | "BACKTEST";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleDelay: number;
  layer: number;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  angle: number;
  length: number;
  duration: number;
  delay: number;
}

function Starfield() {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() < 0.1 ? 2.5 : Math.random() < 0.3 ? 1.5 : 1,
      opacity: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 2 + Math.random() * 4,
      twinkleDelay: Math.random() * 5,
      layer: Math.floor(Math.random() * 3),
    }));
  }, []);

  const shootingStars = useMemo<ShootingStar[]>(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      startX: 10 + Math.random() * 80,
      startY: Math.random() * 40,
      angle: 30 + Math.random() * 30,
      length: 80 + Math.random() * 120,
      duration: 1 + Math.random() * 0.5,
      delay: i * 4 + Math.random() * 8,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="50%" stopColor="#C45A3B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C45A3B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shootingStarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="30%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#C45A3B" stopOpacity="0" />
          </linearGradient>
          <filter id="starBlur">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>

        {stars.map((star) => (
          <g key={star.id}>
            <circle
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill={star.size > 2 ? "url(#starGlow)" : "#fff"}
              filter={star.size > 1.5 ? "url(#starBlur)" : undefined}
              style={{
                animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite`,
                animationDelay: `${star.twinkleDelay}s`,
                opacity: star.opacity,
              }}
            />
            {star.size > 2 && (
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.size * 3}
                fill="url(#starGlow)"
                style={{
                  animation: `pulse ${star.twinkleSpeed}s ease-in-out infinite`,
                  animationDelay: `${star.twinkleDelay}s`,
                  opacity: 0.3,
                }}
              />
            )}
          </g>
        ))}

        {shootingStars.map((star) => (
          <line
            key={`shooting-${star.id}`}
            x1={`${star.startX}%`}
            y1={`${star.startY}%`}
            x2={`${star.startX + star.length * Math.cos(star.angle * Math.PI / 180) / 10}%`}
            y2={`${star.startY + star.length * Math.sin(star.angle * Math.PI / 180) / 10}%`}
            stroke="url(#shootingStarGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              animation: `shootingStar ${star.duration}s ease-out infinite`,
              animationDelay: `${star.delay}s`,
              transformOrigin: `${star.startX}% ${star.startY}%`,
            }}
          />
        ))}
      </svg>

    </div>
  );
}

function NebulaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[800px] h-[800px] -top-40 -right-40 rounded-full opacity-30"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(196, 90, 59, 0.4) 0%,
            rgba(196, 90, 59, 0.1) 30%,
            rgba(139, 154, 125, 0.05) 60%,
            transparent 70%)`,
          animation: "nebulaPulse 8s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] -bottom-20 -left-20 rounded-full opacity-25"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(139, 154, 125, 0.5) 0%,
            rgba(139, 154, 125, 0.15) 40%,
            rgba(196, 90, 59, 0.05) 60%,
            transparent 70%)`,
          animation: "nebulaPulse 10s ease-in-out infinite 2s",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute w-[500px] h-[300px] top-1/3 left-1/4 rounded-full opacity-15"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(196, 90, 59, 0.3) 0%,
            rgba(139, 154, 125, 0.1) 50%,
            transparent 70%)`,
          animation: "nebulaDrift 15s ease-in-out infinite",
          filter: "blur(100px)",
        }}
      />
    </div>
  );
}

function CosmicDust() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 10,
      opacity: 0.1 + Math.random() * 0.3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(196, 90, 59, ${p.opacity}) 0%, transparent 70%)`,
            animation: `cosmicFloat ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function ScanningEffect({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div
        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C45A3B] to-transparent"
        style={{
          animation: "scanLine 2s ease-in-out infinite",
          boxShadow: "0 0 30px 10px rgba(196, 90, 59, 0.5)",
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#C45A3B]/10 via-transparent to-[#C45A3B]/10"
        style={{
          animation: "scanPulse 1s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function HolographicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      <div
        className="absolute -inset-1 rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(45deg,
            rgba(196, 90, 59, 0.4) 0%,
            rgba(139, 154, 125, 0.3) 25%,
            rgba(196, 90, 59, 0.4) 50%,
            rgba(139, 154, 125, 0.3) 75%,
            rgba(196, 90, 59, 0.4) 100%)`,
          backgroundSize: "200% 200%",
          animation: "holographicShift 4s ease-in-out infinite",
          filter: "blur(15px)",
        }}
      />
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-50"
        style={{
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 45%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0.1) 55%,
            transparent 100%)`,
          backgroundSize: "200% 100%",
          animation: "holoShine 3s ease-in-out infinite",
        }}
      />
      <div className="relative rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function PulseRings({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 border-[#C45A3B]/30"
          style={{
            width: 100 + i * 80,
            height: 100 + i * 80,
            animation: `pulseRing 2s ease-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function AIJournalPage() {
  const { user, edges, subscription, canAccess, isLoaded, addLog } =
    useEdgeStore();
  const [mode, setMode] = useState<UploadMode>("file");
  const [url, setUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedChartData | null>(null);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [logType, setLogType] = useState<LogType>("FRONTTEST");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const hasAccess = canAccess("ai_parser");

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!hasAccess) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [hasAccess]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setError(null);
      setParsedData(null);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleUrlSubmit = useCallback(() => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isTradingViewUrl(url)) {
      setError("Please enter a valid TradingView chart URL");
      return;
    }

    setImagePreview(null);
    setError(null);
    setParsedData(null);
    setSaved(false);
  }, [url]);

  const parseChart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const body: {
        imageUrl?: string;
        imageBase64?: string;
        edgeId?: string;
      } = {};

      if (mode === "url" && url) {
        body.imageUrl = url;
      } else if (imagePreview) {
        body.imageBase64 = imagePreview;
      } else {
        setError("No image to parse");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/parse-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: ChartParseResponse = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to parse chart");
        return;
      }

      if (data.success && data.data) {
        setParsedData(data.data);
        if (data.usage) {
          setUsage(data.usage);
        }
      } else {
        setError(data.error || "Failed to parse chart");
      }
    } catch (err) {
      console.error("Parse error:", err);
      setError("Failed to parse chart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const saveToJournal = async () => {
    if (!parsedData || !selectedEdgeId) return;

    setIsSaving(true);

    try {
      const dayName = new Date(parsedData.date).toLocaleString("en-US", {
        weekday: "long",
      }) as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
      await addLog(selectedEdgeId, {
        result: parsedData.outcome === "OPEN" ? "NO_SETUP" : "OCCURRED",
        outcome:
          parsedData.outcome === "WIN"
            ? "WIN"
            : parsedData.outcome === "LOSS"
            ? "LOSS"
            : null,
        logType: logType,
        dayOfWeek: dayName,
        durationMinutes: 0,
        date: parsedData.date,
        entryPrice: parsedData.entryPrice,
        stopLoss: parsedData.stopLoss,
        direction: parsedData.direction,
        symbol: parsedData.symbol,
        entryTime: parsedData.time,
        note: `AI Parsed: R:R ${parsedData.riskReward}, Confidence: ${Math.round(
          parsedData.confidence * 100
        )}%`,
        tvLinks: [],
      });

      setSaved(true);
      setShowSaveModal(false);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save to journal");
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setImagePreview(null);
    setUrl("");
    setParsedData(null);
    setError(null);
    setSaved(false);
    setSelectedEdgeId(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <Sparkles className="w-8 h-8 text-[#C45A3B]/30" />
          </div>
          <Sparkles className="w-8 h-8 text-[#C45A3B] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Please log in</h1>
          <p className="text-muted-foreground">
            You need to be logged in to use AI Journal.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <UpgradePrompt
            feature="AI Screenshot Parser"
            requiredTier="inner_circle"
            currentTier={subscription?.tier}
            variant="modal"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cosmic Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />
      <NebulaBackground />
      <Starfield />
      <CosmicDust />

      <div className="relative max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div className="space-y-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:-translate-x-1 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:scale-110" />
              Back to Dashboard
            </Link>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-4 bg-[#C45A3B]/30 rounded-full blur-2xl animate-pulse" />
                  <div className="absolute -inset-2 bg-[#C45A3B]/20 rounded-full blur-xl" />
                  <div
                    className="relative p-3 rounded-2xl text-white overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #C45A3B 0%, #8B9A7D 100%)",
                      boxShadow: "0 0 40px rgba(196, 90, 59, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    <Zap className="w-6 h-6 relative z-10" />
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
                        backgroundSize: "200% 200%",
                        animation: "iconShine 2s ease-in-out infinite",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h1
                    className="text-4xl tracking-tight"
                    style={{
                      fontFamily: "'Libre Baskerville', Georgia, serif",
                      background: "linear-gradient(135deg, currentColor 0%, currentColor 60%, #C45A3B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    AI Chart Parser
                  </h1>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Powered by neural vision technology
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Usage Counter */}
          {usage && (
            <HolographicCard>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#8B9A7D] animate-pulse" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Neural Scans
                  </p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-4xl font-light tabular-nums"
                    style={{
                      background: "linear-gradient(180deg, currentColor 0%, #C45A3B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {usage.remaining}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {usage.limit}
                  </span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(usage.remaining / usage.limit) * 100}%`,
                      background: "linear-gradient(90deg, #C45A3B 0%, #8B9A7D 50%, #C45A3B 100%)",
                      backgroundSize: "200% 100%",
                      animation: "gradientMove 3s linear infinite",
                    }}
                  />
                </div>
              </div>
            </HolographicCard>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr,1.2fr]">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#C45A3B]/10 via-transparent to-[#8B9A7D]/10 rounded-2xl blur-xl" />
              <div className="relative flex p-1.5 gap-1 rounded-2xl bg-card/50 backdrop-blur-xl border border-white/5">
                <button
                  onClick={() => setMode("file")}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300",
                    mode === "file"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "file" && (
                    <div
                      className="absolute inset-0 rounded-xl bg-background/80"
                      style={{
                        boxShadow: "0 0 20px rgba(196, 90, 59, 0.15)",
                      }}
                    />
                  )}
                  <Upload className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Upload</span>
                </button>
                <button
                  onClick={() => setMode("url")}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300",
                    mode === "url"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "url" && (
                    <div
                      className="absolute inset-0 rounded-xl bg-background/80"
                      style={{
                        boxShadow: "0 0 20px rgba(139, 154, 125, 0.15)",
                      }}
                    />
                  )}
                  <LinkIcon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">TV Link</span>
                </button>
              </div>
            </div>

            {mode === "file" ? (
              <div className="relative">
                <ScanningEffect isActive={isLoading && !!imagePreview} />
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-500 overflow-hidden",
                    imagePreview
                      ? "border-[#8B9A7D]/40 bg-[#8B9A7D]/5"
                      : "border-border/50 hover:border-[#C45A3B]/40 hover:bg-[#C45A3B]/5 group"
                  )}
                  style={{
                    boxShadow: imagePreview
                      ? "inset 0 0 60px rgba(139, 154, 125, 0.1)"
                      : "inset 0 0 60px rgba(196, 90, 59, 0.05)",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />

                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <div
                          className="absolute -inset-3 rounded-2xl"
                          style={{
                            background: "linear-gradient(135deg, rgba(139, 154, 125, 0.3), rgba(196, 90, 59, 0.3))",
                            filter: "blur(20px)",
                            animation: "breathe 3s ease-in-out infinite",
                          }}
                        />
                        <img
                          src={imagePreview}
                          alt="Chart preview"
                          className="relative max-h-56 mx-auto rounded-xl shadow-2xl ring-1 ring-white/10"
                        />
                        <PulseRings isActive={isLoading} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click or drop to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5 py-6">
                      <div className="relative mx-auto w-24 h-24">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "radial-gradient(circle, rgba(196, 90, 59, 0.2) 0%, transparent 70%)",
                            animation: "breathe 3s ease-in-out infinite",
                          }}
                        />
                        <div
                          className="absolute inset-2 rounded-full border border-[#C45A3B]/20"
                          style={{
                            animation: "spin 20s linear infinite",
                          }}
                        />
                        <div className="absolute inset-4 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center border border-white/5">
                          <ImageIcon className="w-8 h-8 text-muted-foreground group-hover:text-[#C45A3B] transition-colors duration-300" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-lg">
                          Drop your chart here
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          or click to browse • Paste with{" "}
                          <kbd className="px-2 py-1 rounded-lg bg-card/80 border border-white/10 text-xs font-mono">
                            ⌘V
                          </kbd>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <HolographicCard>
                <div className="p-6 space-y-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    TradingView Chart URL
                  </Label>
                  <div className="relative">
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.tradingview.com/x/..."
                      onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                      className="h-12 bg-background/30 border-white/10 rounded-xl pr-12 focus:ring-[#C45A3B]/30"
                    />
                    <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share your TradingView chart and paste the link here
                  </p>
                </div>
              </HolographicCard>
            )}

            {error && (
              <div
                className="p-4 rounded-xl text-sm animate-in slide-in-from-top-2"
                style={{
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={parseChart}
              disabled={isLoading || (!imagePreview && !url)}
              className={cn(
                "relative w-full h-14 rounded-2xl font-medium transition-all duration-300 overflow-hidden group",
                isLoading || (!imagePreview && !url)
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "text-white hover:-translate-y-1"
              )}
              style={
                !isLoading && (imagePreview || url)
                  ? {
                      background: "linear-gradient(135deg, #C45A3B 0%, #8B9A7D 100%)",
                      boxShadow: "0 10px 40px rgba(196, 90, 59, 0.3), 0 0 0 1px rgba(255,255,255,0.1) inset",
                    }
                  : undefined
              }
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
                  backgroundSize: "200% 200%",
                  animation: "buttonShine 1.5s ease-in-out infinite",
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing chart...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Parse Chart
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {parsedData ? (
              <HolographicCard className="animate-in fade-in slide-in-from-right-6 duration-700">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#8B9A7D] rounded-xl blur-lg opacity-50" />
                        <div
                          className="relative p-2.5 rounded-xl text-white"
                          style={{
                            background: "linear-gradient(135deg, #8B9A7D 0%, #8B9A7D 100%)",
                            boxShadow: "0 0 20px rgba(139, 154, 125, 0.3)",
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <h3
                          className="text-xl font-medium"
                          style={{
                            fontFamily: "'Libre Baskerville', Georgia, serif",
                          }}
                        >
                          Analysis Complete
                        </h3>
                        <p className="text-xs text-muted-foreground">Neural scan successful</p>
                      </div>
                    </div>
                    <button
                      onClick={reset}
                      className="p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Symbol Hero */}
                  <div
                    className="relative p-6 rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(196, 90, 59, 0.1) 0%, rgba(139, 154, 125, 0.1) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C45A3B]/10 rounded-full blur-3xl" />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Symbol</p>
                        <p
                          className="text-4xl font-bold tracking-tight"
                          style={{
                            background: "linear-gradient(135deg, currentColor 0%, #C45A3B 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {parsedData.symbol}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "px-4 py-2 rounded-xl font-bold text-lg",
                          parsedData.direction === "LONG"
                            ? "bg-[#8B9A7D]/20 text-[#8B9A7D]"
                            : "bg-[#C45A3B]/20 text-[#C45A3B]"
                        )}
                        style={{
                          boxShadow: parsedData.direction === "LONG"
                            ? "0 0 30px rgba(139, 154, 125, 0.2)"
                            : "0 0 30px rgba(196, 90, 59, 0.2)",
                        }}
                      >
                        {parsedData.direction}
                      </div>
                    </div>
                  </div>

                  {/* Data Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <DataCell
                      label="Entry"
                      value={parsedData.entryPrice.toLocaleString()}
                      valueClassName="font-mono text-base"
                    />
                    <DataCell
                      label="Stop Loss"
                      value={parsedData.stopLoss.toLocaleString()}
                      valueClassName="font-mono text-base text-[#C45A3B]"
                    />
                    <DataCell
                      label="Take Profit"
                      value={parsedData.takeProfit.toLocaleString()}
                      valueClassName="font-mono text-base text-[#8B9A7D]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <DataCell
                      label="R:R Ratio"
                      value={`${parsedData.riskReward}R`}
                      valueClassName="font-mono text-lg font-bold"
                    />
                    <DataCell
                      label="Outcome"
                      value={parsedData.outcome}
                      valueClassName={cn(
                        "font-bold text-lg",
                        parsedData.outcome === "WIN"
                          ? "text-[#8B9A7D]"
                          : parsedData.outcome === "LOSS"
                          ? "text-[#C45A3B]"
                          : "text-muted-foreground"
                      )}
                    />
                    <DataCell label="Time" value={`${parsedData.date} ${parsedData.time}`} valueClassName="text-sm" />
                  </div>

                  {/* Confidence bar */}
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#8B9A7D] animate-pulse" />
                        Neural Confidence
                      </span>
                      <span
                        className="font-bold text-lg"
                        style={{
                          background: "linear-gradient(90deg, #8B9A7D 0%, #C45A3B 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {Math.round(parsedData.confidence * 100)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${parsedData.confidence * 100}%`,
                          background: "linear-gradient(90deg, #8B9A7D 0%, #C45A3B 100%)",
                          boxShadow: "0 0 20px rgba(139, 154, 125, 0.5)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  {saved ? (
                    <div
                      className="flex items-center justify-center gap-3 p-5 rounded-2xl animate-in zoom-in-95"
                      style={{
                        background: "linear-gradient(135deg, rgba(139, 154, 125, 0.15), rgba(139, 154, 125, 0.05))",
                        border: "1px solid rgba(139, 154, 125, 0.3)",
                        boxShadow: "0 0 40px rgba(139, 154, 125, 0.2)",
                      }}
                    >
                      <div className="p-2 rounded-full bg-[#8B9A7D]/20">
                        <Check className="w-5 h-5 text-[#8B9A7D]" />
                      </div>
                      <span className="font-medium text-[#8B9A7D]">Saved to journal</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSaveClick}
                      className="relative w-full h-14 rounded-2xl font-medium transition-all duration-300 overflow-hidden group hover:-translate-y-1"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)) 100%)",
                        color: "hsl(var(--background))",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                          backgroundSize: "200% 200%",
                          animation: "buttonShine 1.5s ease-in-out infinite",
                        }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" />
                        Save to Journal
                      </span>
                    </button>
                  )}
                </div>
              </HolographicCard>
            ) : (
              <div
                className="relative h-full min-h-[500px] flex items-center justify-center rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(196, 90, 59, 0.03) 0%, rgba(139, 154, 125, 0.03) 100%)",
                  border: "2px dashed rgba(255, 255, 255, 0.1)",
                }}
              >
                <div className="absolute inset-0">
                  <div
                    className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(196, 90, 59, 0.1) 0%, transparent 70%)",
                      animation: "breathe 4s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(139, 154, 125, 0.1) 0%, transparent 70%)",
                      animation: "breathe 5s ease-in-out infinite 1s",
                    }}
                  />
                </div>
                <div className="relative text-center space-y-6 p-8">
                  <div className="relative mx-auto w-24 h-24">
                    <div
                      className="absolute inset-0 rounded-full border border-[#C45A3B]/20"
                      style={{ animation: "spin 20s linear infinite" }}
                    />
                    <div
                      className="absolute inset-3 rounded-full border border-[#8B9A7D]/20"
                      style={{ animation: "spin 15s linear infinite reverse" }}
                    />
                    <div className="absolute inset-6 rounded-full bg-card/50 backdrop-blur-sm flex items-center justify-center border border-white/5">
                      <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg text-muted-foreground font-medium">
                      Ready for neural analysis
                    </p>
                    <p className="text-sm text-muted-foreground/60">
                      Upload a TradingView chart to begin
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent
          showCloseButton={false}
          className="bg-transparent border-0 p-0 max-w-md overflow-visible shadow-none"
        >
          <div className="relative">
            {/* Outer glow */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-60"
              style={{
                background: "linear-gradient(135deg, rgba(196, 90, 59, 0.3) 0%, rgba(139, 154, 125, 0.3) 100%)",
                filter: "blur(30px)",
              }}
            />

            {/* Modal content */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)",
                boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Animated border gradient */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `linear-gradient(90deg,
                    transparent 0%,
                    rgba(196, 90, 59, 0.3) 25%,
                    rgba(139, 154, 125, 0.3) 50%,
                    rgba(196, 90, 59, 0.3) 75%,
                    transparent 100%)`,
                  backgroundSize: "200% 100%",
                  animation: "borderGlow 3s linear infinite",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                  padding: "1px",
                }}
              />

              {/* Inner stars */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-0.5 rounded-full bg-white/30"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative p-7 space-y-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#C45A3B] rounded-xl blur-lg opacity-50" />
                      <div
                        className="relative p-3 rounded-xl text-white"
                        style={{
                          background: "linear-gradient(135deg, #C45A3B 0%, #8B9A7D 100%)",
                          boxShadow: "0 0 20px rgba(196, 90, 59, 0.4)",
                        }}
                      >
                        <Save className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <DialogTitle
                        className="text-2xl"
                        style={{
                          fontFamily: "'Libre Baskerville', Georgia, serif",
                        }}
                      >
                        Save to Journal
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Record your trade analysis</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Edge Selector */}
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C45A3B]" />
                    Select Edge
                  </Label>
                  <Select
                    value={selectedEdgeId || ""}
                    onValueChange={(v) => setSelectedEdgeId(v || null)}
                  >
                    <SelectTrigger
                      className="h-14 rounded-xl border-white/10 focus:ring-[#C45A3B]/30"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <SelectValue placeholder="Choose an edge..." />
                    </SelectTrigger>
                    <SelectContent>
                      {edges.map((edge) => (
                        <SelectItem key={edge.id} value={edge.id}>
                          {edge.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Log Type Toggle */}
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B9A7D]" />
                    Log Type
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setLogType("FRONTTEST")}
                      className={cn(
                        "relative flex items-center justify-center gap-2 h-14 rounded-xl transition-all duration-300 overflow-hidden",
                        logType === "FRONTTEST"
                          ? "text-[#8B9A7D]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      style={
                        logType === "FRONTTEST"
                          ? {
                              background: "linear-gradient(135deg, rgba(139, 154, 125, 0.15), rgba(139, 154, 125, 0.05))",
                              border: "1px solid rgba(139, 154, 125, 0.4)",
                              boxShadow: "0 0 30px rgba(139, 154, 125, 0.15), inset 0 0 20px rgba(139, 154, 125, 0.05)",
                            }
                          : {
                              background: "rgba(255, 255, 255, 0.02)",
                              border: "1px solid rgba(255, 255, 255, 0.05)",
                            }
                      }
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-medium">Live</span>
                    </button>
                    <button
                      onClick={() => setLogType("BACKTEST")}
                      className={cn(
                        "relative flex items-center justify-center gap-2 h-14 rounded-xl transition-all duration-300 overflow-hidden",
                        logType === "BACKTEST"
                          ? "text-[#C45A3B]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      style={
                        logType === "BACKTEST"
                          ? {
                              background: "linear-gradient(135deg, rgba(196, 90, 59, 0.15), rgba(196, 90, 59, 0.05))",
                              border: "1px solid rgba(196, 90, 59, 0.4)",
                              boxShadow: "0 0 30px rgba(196, 90, 59, 0.15), inset 0 0 20px rgba(196, 90, 59, 0.05)",
                            }
                          : {
                              background: "rgba(255, 255, 255, 0.02)",
                              border: "1px solid rgba(255, 255, 255, 0.05)",
                            }
                      }
                    >
                      <History className="w-5 h-5" />
                      <span className="font-medium">Backtest</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 h-12 rounded-xl font-medium transition-all duration-300 hover:bg-white/5"
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveToJournal}
                    disabled={isSaving || !selectedEdgeId}
                    className={cn(
                      "relative flex-1 h-12 rounded-xl font-medium transition-all duration-300 overflow-hidden group",
                      isSaving || !selectedEdgeId
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "text-white hover:-translate-y-0.5"
                    )}
                    style={
                      !isSaving && selectedEdgeId
                        ? {
                            background: "linear-gradient(135deg, #C45A3B 0%, #8B9A7D 100%)",
                            boxShadow: "0 10px 30px rgba(196, 90, 59, 0.3)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
                        backgroundSize: "200% 200%",
                        animation: "buttonShine 1.5s ease-in-out infinite",
                      }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Confirm
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DataCell({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl overflow-hidden group",
        className
      )}
      style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(196, 90, 59, 0.05) 0%, rgba(139, 154, 125, 0.05) 100%)",
        }}
      />
      <p className="relative text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
        {label}
      </p>
      <p className={cn("relative font-medium", valueClassName)}>{value}</p>
    </div>
  );
}
