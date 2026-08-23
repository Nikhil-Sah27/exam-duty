import { Calendar, Clock, Layers } from "lucide-react";

interface DateTimeSectionHeaderProps {
  /** ISO date string. */
  date: string;
  /** HH:MM 24-hour. */
  startTime: string;
  endTime: string;
  /** Count shown as a pill on the right (rooms, groups, duties — caller's choice). */
  count: number;
  /** Singular / plural forms for the count pill. Defaults to `duty` / `duties`. */
  itemLabelSingular?: string;
  itemLabelPlural?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Reusable date+time section band. Rendered above any list of duty items
 * (RS groups, DCS supervision groups, invigilator slots) that all fall in
 * the same schedule window. Presentation-only — the caller partitions and
 * sorts the underlying data.
 */
export default function DateTimeSectionHeader({
  date,
  startTime,
  endTime,
  count,
  itemLabelSingular = "duty",
  itemLabelPlural = "duties",
}: DateTimeSectionHeaderProps) {
  const label = count === 1 ? itemLabelSingular : itemLabelPlural;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-gray-800">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          {formatDate(date)}
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {formatTime(startTime)} – {formatTime(endTime)}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        <Layers className="h-3 w-3" /> {count} {label}
      </span>
    </div>
  );
}
