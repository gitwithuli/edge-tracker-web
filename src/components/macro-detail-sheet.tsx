"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MacroLog,
  MacroDirection,
  MacroLogInput,
  DisplacementQuality,
  LiquiditySweep,
} from "@/hooks/use-macro-store";
import { ALL_MACROS, MacroCategory } from "@/lib/macro-constants";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Trash2,
  Pencil,
  X,
  Check,
  Image as ImageIcon,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MacroDetailSheetProps {
  log: MacroLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (logId: string, updates: Partial<MacroLogInput>) => void;
  onDelete: (logId: string) => void;
}

const categoryLabels: Record<MacroCategory, string> = {
  overnight: "Overnight",
  london: "London",
  rth: "RTH",
  rth_close: "RTH Close",
  asia: "Asia",
};

const directionConfig: Record<
  MacroDirection,
  { bg: string; darkBg: string; text: string; icon: React.ReactNode; label: string }
> = {
  BULLISH: {
    bg: "bg-[#8B9A7D]",
    darkBg: "dark:bg-[#8B9A7D]/80",
    text: "text-white",
    icon: <ArrowUp className="w-4 h-4" />,
    label: "Bullish",
  },
  BEARISH: {
    bg: "bg-[#C45A3B]",
    darkBg: "dark:bg-[#C45A3B]/80",
    text: "text-white",
    icon: <ArrowDown className="w-4 h-4" />,
    label: "Bearish",
  },
  CONSOLIDATION: {
    bg: "bg-[#0F0F0F]/20",
    darkBg: "dark:bg-white/20",
    text: "text-[#0F0F0F] dark:text-white",
    icon: <Minus className="w-4 h-4" />,
    label: "Consolidation",
  },
};

function extractThumbnailFromTvLink(url: string): string | null {
  try {
    const tvUrl = new URL(url);
    if (tvUrl.hostname.includes("tradingview.com")) {
      const xMatch = url.match(/\/x\/([A-Za-z0-9]+)/);
      if (xMatch) {
        const id = xMatch[1];
        return `https://s3.tradingview.com/snapshots/${id.charAt(0).toLowerCase()}/${id}.png`;
      }
      const chartMatch = url.match(/\/chart\/([^/]+)/);
      if (chartMatch) {
        return `https://s3.tradingview.com/snapshots/${chartMatch[1].slice(0, 1)}/${chartMatch[1]}.png`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function findMacroById(macroId: string) {
  let macro = ALL_MACROS.find((m) => m.id === macroId);
  if (macro) return macro;

  const hourlyMatch = macroId.match(/^hourly-(\d+)50$/);
  if (hourlyMatch) {
    const hour = parseInt(hourlyMatch[1], 10);
    const paddedId = `hourly-${hour.toString().padStart(2, "0")}50`;
    const unpaddedId = `hourly-${hour}50`;
    macro = ALL_MACROS.find((m) => m.id === paddedId || m.id === unpaddedId);
  }

  return macro;
}

function TvLinkCard({ url, index }: { url: string; index: number }) {
  const [imgError, setImgError] = useState(false);
  const thumbnail = extractThumbnailFromTvLink(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden border border-[#0F0F0F]/10 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#C45A3B]/50 dark:hover:border-[#C45A3B]/50 transition-all hover:shadow-lg"
    >
      <div className="relative aspect-video bg-[#0F0F0F]/5 dark:bg-white/5">
        {thumbnail && !imgError ? (
          <img
            src={thumbnail}
            alt={`Chart ${index + 1}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-[#0F0F0F]/50 dark:text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-black/80 text-xs font-medium text-[#0F0F0F] dark:text-white">
            <ExternalLink className="w-3 h-3" />
            Open
          </div>
        </div>
      </div>
      <div className="px-3 py-2.5 border-t border-[#0F0F0F]/5 dark:border-white/5">
        <p className="text-xs text-[#0F0F0F]/50 dark:text-white/50 truncate">
          {url}
        </p>
      </div>
    </a>
  );
}

export function MacroDetailSheet({
  log,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: MacroDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<MacroLogInput>>({});
  const [newTvLink, setNewTvLink] = useState('');

  if (!log) return null;

  const macro = findMacroById(log.macroId);
  const dirStyle = log.direction ? directionConfig[log.direction] : null;

  const handleStartEdit = () => {
    setEditData({
      pointsMoved: log.pointsMoved,
      direction: log.direction,
      displacementQuality: log.displacementQuality,
      liquiditySweep: log.liquiditySweep,
      tvLinks: log.tvLinks,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(log.id, editData);
    setIsEditing(false);
    setNewTvLink('');
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
    setNewTvLink('');
  };

  const handleAddTvLink = () => {
    const trimmed = newTvLink.trim();
    if (!trimmed || !trimmed.includes('tradingview.com')) return;
    setEditData({ ...editData, tvLinks: [...(editData.tvLinks || []), trimmed] });
    setNewTvLink('');
  };

  const handleRemoveTvLink = (index: number) => {
    setEditData({ ...editData, tvLinks: (editData.tvLinks || []).filter((_, i) => i !== index) });
  };

  const handleDelete = () => {
    onDelete(log.id);
    onOpenChange(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditData({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 p-0 max-w-lg sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#0F0F0F]/[0.06] dark:border-white/[0.06]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#0F0F0F]/50 dark:text-white/50 mb-1">
                {macro ? categoryLabels[macro.category] : "Macro"}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle
                  className="text-xl sm:text-2xl font-normal text-[#0F0F0F] dark:text-white"
                  style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                >
                  {macro?.name || log.macroId}
                </DialogTitle>
                {dirStyle && (
                  <span
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider",
                      dirStyle.bg,
                      dirStyle.darkBg,
                      dirStyle.text
                    )}
                  >
                    {dirStyle.icon}
                    {dirStyle.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#0F0F0F]/50 dark:text-white/50 mt-2">
                {new Date(log.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 -mt-1 rounded-xl hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 pt-4">
          {isEditing ? (
            <div className="space-y-5 p-4 rounded-xl bg-white dark:bg-white/5 border border-[#C45A3B]/30">
              <div className="flex items-center justify-between">
                <h4
                  className="text-sm font-medium text-[#0F0F0F] dark:text-white"
                  style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                >
                  Edit Entry
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    className="p-1.5 rounded-lg hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors text-[#0F0F0F]/50 dark:text-white/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-1.5 rounded-lg bg-[#8B9A7D] text-white hover:bg-[#8B9A7D]/80 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-2">
                  Points Moved
                </div>
                <input
                  type="number"
                  value={editData.pointsMoved ?? ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      pointsMoved: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="e.g. 15"
                  className="w-full h-10 px-3 text-sm bg-[#FAF7F2] dark:bg-[#0F0F0F] border border-[#0F0F0F]/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#C45A3B] text-[#0F0F0F] dark:text-white"
                />
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-2">
                  Direction
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["BULLISH", "BEARISH", "CONSOLIDATION"] as MacroDirection[]).map(
                    (dir) => (
                      <button
                        key={dir}
                        onClick={() => setEditData({ ...editData, direction: dir })}
                        className={cn(
                          "h-10 rounded-lg border text-xs font-medium transition-colors",
                          editData.direction === dir
                            ? dir === "BULLISH"
                              ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                              : dir === "BEARISH"
                              ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                              : "bg-[#0F0F0F]/20 dark:bg-white/20 text-[#0F0F0F] dark:text-white border-[#0F0F0F]/20 dark:border-white/20"
                            : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                        )}
                      >
                        {dir === "CONSOLIDATION"
                          ? "Chop"
                          : dir.charAt(0) + dir.slice(1).toLowerCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-2">
                  Resistance
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["CLEAN", "CHOPPY"] as DisplacementQuality[]).map((qual) => (
                    <button
                      key={qual}
                      onClick={() =>
                        setEditData({ ...editData, displacementQuality: qual })
                      }
                      className={cn(
                        "h-10 rounded-lg border text-xs font-medium transition-colors",
                        editData.displacementQuality === qual
                          ? qual === "CLEAN"
                            ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                            : "bg-[#C45A3B] text-white border-[#C45A3B]"
                          : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                      )}
                    >
                      {qual === "CLEAN" ? "Low" : "High"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-2">
                  Liquidity Sweep
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(["HIGHS", "LOWS", "BOTH", "NONE"] as LiquiditySweep[]).map(
                    (liq) => (
                      <button
                        key={liq}
                        onClick={() =>
                          setEditData({ ...editData, liquiditySweep: liq })
                        }
                        className={cn(
                          "h-10 rounded-lg border text-xs font-medium transition-colors",
                          editData.liquiditySweep === liq
                            ? liq === "HIGHS"
                              ? "bg-[#8B9A7D] text-white border-[#8B9A7D]"
                              : liq === "LOWS"
                              ? "bg-[#C45A3B] text-white border-[#C45A3B]"
                              : liq === "BOTH"
                              ? "bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] border-[#0F0F0F] dark:border-white"
                              : "bg-[#0F0F0F]/20 dark:bg-white/20 text-[#0F0F0F] dark:text-white border-[#0F0F0F]/20 dark:border-white/20"
                            : "border-[#0F0F0F]/10 dark:border-white/10 text-[#0F0F0F]/60 dark:text-white/60 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5"
                        )}
                      >
                        {liq.charAt(0) + liq.slice(1).toLowerCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* TV Links */}
              <div>
                <div className="text-xs uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-2">
                  Chart Links ({(editData.tvLinks || []).length})
                </div>
                {(editData.tvLinks || []).length > 0 && (
                  <div className="space-y-2 mb-3">
                    {(editData.tvLinks || []).map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#0F0F0F] border border-[#0F0F0F]/10 dark:border-white/10"
                      >
                        <ImageIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#0F0F0F]/50 dark:text-white/50" />
                        <span className="flex-1 text-xs text-[#0F0F0F]/70 dark:text-white/70 truncate">
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTvLink(idx)}
                          className="p-1 rounded hover:bg-[#C45A3B]/10 text-[#C45A3B] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newTvLink}
                    onChange={(e) => setNewTvLink(e.target.value)}
                    placeholder="Paste TradingView snapshot URL..."
                    className="flex-1 h-10 px-3 text-sm bg-[#FAF7F2] dark:bg-[#0F0F0F] border border-[#0F0F0F]/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#C45A3B] text-[#0F0F0F] dark:text-white placeholder:text-[#0F0F0F]/30 dark:placeholder:text-white/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTvLink();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTvLink}
                    disabled={!newTvLink.trim() || !newTvLink.includes('tradingview.com')}
                    className="h-10 px-4 rounded-lg bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] text-sm font-medium hover:bg-[#0F0F0F]/80 dark:hover:bg-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10">
                  <div className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-1">
                    Points Moved
                  </div>
                  <div className="text-2xl font-bold text-[#0F0F0F] dark:text-white">
                    {log.pointsMoved !== null ? `${log.pointsMoved}` : "—"}
                    {log.pointsMoved !== null && (
                      <span className="text-sm font-normal text-[#0F0F0F]/50 dark:text-white/50 ml-1">pts</span>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10">
                  <div className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-1">
                    Resistance
                  </div>
                  <div className="flex items-center gap-2">
                    {log.displacementQuality && (
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        log.displacementQuality === "CLEAN" ? "bg-[#8B9A7D]" : "bg-[#C45A3B]"
                      )} />
                    )}
                    <span className="text-2xl font-bold text-[#0F0F0F] dark:text-white">
                      {log.displacementQuality
                        ? log.displacementQuality === "CLEAN"
                          ? "Low"
                          : "High"
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {log.liquiditySweep && log.liquiditySweep !== "NONE" && (
                <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10">
                  <div className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50 mb-1">
                    Liquidity Sweep
                  </div>
                  <div className="text-lg font-bold text-[#0F0F0F] dark:text-white capitalize">
                    {log.liquiditySweep.toLowerCase()}
                  </div>
                </div>
              )}

              {log.note && (
                <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="w-3.5 h-3.5 text-[#0F0F0F]/50 dark:text-white/50" />
                    <div className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50">
                      Notes
                    </div>
                  </div>
                  <p className="text-sm text-[#0F0F0F]/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                    {log.note}
                  </p>
                </div>
              )}

              {log.tvLinks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0F0F0F]/50 dark:text-white/50" />
                    <div className="text-[10px] uppercase tracking-wider text-[#0F0F0F]/50 dark:text-white/50">
                      TradingView Charts ({log.tvLinks.length})
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {log.tvLinks.map((url, idx) => (
                      <TvLinkCard key={idx} url={url} index={idx} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isEditing && (
          <div className="p-5 sm:p-6 pt-4 border-t border-[#0F0F0F]/[0.06] dark:border-white/[0.06] flex items-center gap-3">
            <button
              onClick={handleStartEdit}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-[#0F0F0F]/10 dark:border-white/10 text-sm font-medium text-[#0F0F0F] dark:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-[#C45A3B]/30 text-sm font-medium text-[#C45A3B] hover:bg-[#C45A3B]/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF7F2] dark:bg-[#0F0F0F] border-[#0F0F0F]/10 dark:border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle
                    className="text-[#0F0F0F] dark:text-white"
                    style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
                  >
                    Delete macro log?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#0F0F0F]/60 dark:text-white/60">
                    This will permanently delete this macro entry. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full border-[#0F0F0F]/10 dark:border-white/10 hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 text-[#0F0F0F] dark:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="rounded-full bg-[#C45A3B] hover:bg-[#C45A3B]/90 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
