"use client";

import { useState, useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export type DateRangePreset = "week" | "month" | "quarter" | "year" | "all" | "custom";

export interface DateRange {
  start: string | null;
  end: string | null;
  preset: DateRangePreset;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "week", label: "7D" },
  { value: "month", label: "30D" },
  { value: "quarter", label: "90D" },
  { value: "year", label: "1Y" },
  { value: "all", label: "All" },
];

function getPresetDates(preset: DateRangePreset): { start: string | null; end: string | null } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];

  switch (preset) {
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start: start.toISOString().split("T")[0], end };
    }
    case "month": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start: start.toISOString().split("T")[0], end };
    }
    case "quarter": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { start: start.toISOString().split("T")[0], end };
    }
    case "year": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { start: start.toISOString().split("T")[0], end };
    }
    case "all":
    case "custom":
    default:
      return { start: null, end: null };
  }
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.preset === "custom");

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setShowCustom(true);
      onChange({ start: value.start, end: value.end, preset: "custom" });
    } else {
      setShowCustom(false);
      const dates = getPresetDates(preset);
      onChange({ ...dates, preset });
    }
  };

  const handleCustomDateChange = (field: "start" | "end", dateValue: string) => {
    onChange({
      ...value,
      [field]: dateValue || null,
      preset: "custom",
    });
  };

  const displayRange = useMemo(() => {
    if (value.preset === "all") return "All time";
    if (!value.start && !value.end) return "Select range";

    const formatDate = (d: string) =>
      new Date(d + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

    if (value.start && value.end) {
      if (value.start === value.end) return formatDate(value.start);
      return `${formatDate(value.start)} - ${formatDate(value.end)}`;
    }
    if (value.start) return `From ${formatDate(value.start)}`;
    if (value.end) return `Until ${formatDate(value.end)}`;
    return "Select range";
  }, [value]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Preset buttons */}
      <div className="flex items-center gap-1 p-1 bg-[#0F0F0F]/5 rounded-full">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
              value.preset === preset.value && !showCustom
                ? "bg-[#0F0F0F] text-[#FAF7F2]"
                : "text-[#0F0F0F]/50 hover:text-[#0F0F0F]"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => handlePresetChange("custom")}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
            showCustom
              ? "bg-[#0F0F0F] text-[#FAF7F2]"
              : "text-[#0F0F0F]/50 hover:text-[#0F0F0F]"
          }`}
        >
          <Calendar className="w-3 h-3" />
          Custom
        </button>
      </div>

      {/* Custom date picker */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.start || ""}
            onChange={(e) => handleCustomDateChange("start", e.target.value)}
            max={value.end || new Date().toISOString().split("T")[0]}
            className="px-3 py-1.5 text-xs bg-white border border-[#0F0F0F]/10 rounded-lg focus:border-[#C45A3B] focus:outline-none focus:ring-1 focus:ring-[#C45A3B]/20"
          />
          <span className="text-xs text-[#0F0F0F]/30">to</span>
          <input
            type="date"
            value={value.end || ""}
            onChange={(e) => handleCustomDateChange("end", e.target.value)}
            min={value.start || undefined}
            max={new Date().toISOString().split("T")[0]}
            className="px-3 py-1.5 text-xs bg-white border border-[#0F0F0F]/10 rounded-lg focus:border-[#C45A3B] focus:outline-none focus:ring-1 focus:ring-[#C45A3B]/20"
          />
        </div>
      )}

      {/* Display current range */}
      {!showCustom && value.preset !== "all" && (
        <span className="text-xs text-[#0F0F0F]/40">{displayRange}</span>
      )}
    </div>
  );
}

export function filterLogsByDateRange<T extends { date?: string }>(
  logs: T[],
  range: DateRange
): T[] {
  if (range.preset === "all" && !range.start && !range.end) {
    return logs;
  }

  return logs.filter((log) => {
    if (!log.date) return true;
    if (range.start && log.date < range.start) return false;
    if (range.end && log.date > range.end) return false;
    return true;
  });
}

export function getDefaultDateRange(): DateRange {
  return { start: null, end: null, preset: "all" };
}
