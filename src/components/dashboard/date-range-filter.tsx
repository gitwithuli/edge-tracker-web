"use client";

import { useState, useMemo } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

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

function parseDate(dateStr: string | null): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr + "T12:00:00");
}

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.preset === "custom");
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

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

  const handleStartDateSelect = (date: Date | undefined) => {
    onChange({
      ...value,
      start: date ? formatDateStr(date) : null,
      preset: "custom",
    });
    setStartOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onChange({
      ...value,
      end: date ? formatDateStr(date) : null,
      preset: "custom",
    });
    setEndOpen(false);
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

  const startDate = parseDate(value.start);
  const endDate = parseDate(value.end);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Preset buttons */}
      <div className="flex items-center gap-1 p-1 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-full">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 ${
              value.preset === preset.value && !showCustom
                ? "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F]"
                : "text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => handlePresetChange("custom")}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 flex items-center gap-1 ${
            showCustom
              ? "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F]"
              : "text-[#0F0F0F]/50 dark:text-white/50 hover:text-[#0F0F0F] dark:hover:text-white"
          }`}
        >
          <CalendarIcon className="w-3 h-3" />
          Custom
        </button>
      </div>

      {/* Custom date picker */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <button
                className={`px-3 py-1.5 text-xs bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10 rounded-lg hover:border-[#0F0F0F]/20 dark:hover:border-white/20 transition-colors flex items-center gap-2 ${
                  startDate ? "text-[#0F0F0F] dark:text-white" : "text-[#0F0F0F]/50 dark:text-white/50"
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 rounded-xl shadow-xl"
              align="start"
            >
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                disabled={(date) => {
                  if (endDate && date > endDate) return true;
                  if (date > new Date()) return true;
                  return false;
                }}
                initialFocus
                className="rounded-xl"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  caption_label: "text-sm font-medium text-[#0F0F0F] dark:text-white",
                  nav: "flex items-center gap-1",
                  button_previous: "size-7 bg-transparent hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 rounded-full p-0 text-[#0F0F0F]/60 dark:text-white/60 hover:text-[#0F0F0F] dark:hover:text-white",
                  button_next: "size-7 bg-transparent hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 rounded-full p-0 text-[#0F0F0F]/60 dark:text-white/60 hover:text-[#0F0F0F] dark:hover:text-white",
                  weekday: "text-[#0F0F0F]/50 dark:text-white/50 text-xs font-medium w-8",
                  day: "w-8 h-8 text-[#0F0F0F] dark:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 rounded-full",
                  today: "bg-[#C45A3B]/10 text-[#C45A3B] rounded-full",
                  selected: "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] rounded-full hover:bg-[#0F0F0F] dark:hover:bg-white",
                  outside: "text-[#0F0F0F]/50 dark:text-white/50",
                  disabled: "text-[#0F0F0F]/50 dark:text-white/50",
                }}
              />
            </PopoverContent>
          </Popover>

          <span className="text-xs text-[#0F0F0F]/45 dark:text-white/45">to</span>

          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <button
                className={`px-3 py-1.5 text-xs bg-white dark:bg-white/5 border border-[#0F0F0F]/10 dark:border-white/10 rounded-lg hover:border-[#0F0F0F]/20 dark:hover:border-white/20 transition-colors flex items-center gap-2 ${
                  endDate ? "text-[#0F0F0F] dark:text-white" : "text-[#0F0F0F]/50 dark:text-white/50"
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#FAF7F2] dark:bg-[#1a1a1a] border-[#0F0F0F]/10 dark:border-white/10 rounded-xl shadow-xl"
              align="start"
            >
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                disabled={(date) => {
                  if (startDate && date < startDate) return true;
                  if (date > new Date()) return true;
                  return false;
                }}
                initialFocus
                className="rounded-xl"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  caption_label: "text-sm font-medium text-[#0F0F0F] dark:text-white",
                  nav: "flex items-center gap-1",
                  button_previous: "size-7 bg-transparent hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 rounded-full p-0 text-[#0F0F0F]/60 dark:text-white/60 hover:text-[#0F0F0F] dark:hover:text-white",
                  button_next: "size-7 bg-transparent hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 rounded-full p-0 text-[#0F0F0F]/60 dark:text-white/60 hover:text-[#0F0F0F] dark:hover:text-white",
                  weekday: "text-[#0F0F0F]/50 dark:text-white/50 text-xs font-medium w-8",
                  day: "w-8 h-8 text-[#0F0F0F] dark:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/5 rounded-full",
                  today: "bg-[#C45A3B]/10 text-[#C45A3B] rounded-full",
                  selected: "bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] rounded-full hover:bg-[#0F0F0F] dark:hover:bg-white",
                  outside: "text-[#0F0F0F]/50 dark:text-white/50",
                  disabled: "text-[#0F0F0F]/50 dark:text-white/50",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Display current range */}
      {!showCustom && value.preset !== "all" && (
        <span className="text-xs text-[#0F0F0F]/50 dark:text-white/50">{displayRange}</span>
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
