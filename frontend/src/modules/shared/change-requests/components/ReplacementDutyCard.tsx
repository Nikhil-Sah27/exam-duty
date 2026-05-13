import { Calendar, Clock, DoorOpen, AlertTriangle } from "lucide-react";
import type { ReplacementSlot } from "../types/changeRequest.types";

const DEPT_COLORS: Record<string, string> = {
  CSE: "bg-blue-100 text-blue-700",
  ECE: "bg-purple-100 text-purple-700",
  ISE: "bg-emerald-100 text-emerald-700",
  ME: "bg-orange-100 text-orange-700",
  MECH: "bg-orange-100 text-orange-700",
  CE: "bg-amber-100 text-amber-700",
  EEE: "bg-rose-100 text-rose-700",
  AIML: "bg-indigo-100 text-indigo-700",
};

function getDeptColor(d: string): string {
  return DEPT_COLORS[d.toUpperCase()] || "bg-gray-100 text-gray-600";
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

interface ReplacementDutyCardProps {
  slot: ReplacementSlot;
  conflictReason?: string | null;
  onSelect?: (slot: ReplacementSlot) => void;
  selected?: boolean;
  submitting?: boolean;
}

export default function ReplacementDutyCard({
  slot,
  conflictReason,
  onSelect,
  selected,
  submitting,
}: ReplacementDutyCardProps) {
  const disabled = Boolean(conflictReason) || submitting;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border-2 p-3 transition-all ${
        selected
          ? "border-blue-400 bg-blue-50"
          : conflictReason
            ? "border-orange-200 bg-orange-50/40 opacity-70"
            : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {slot.examType}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
            Sem {slot.semester}
          </span>
        </div>
        <span className="text-[10px] font-medium text-green-600">Vacant</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatDate(slot.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-400" />
          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
        <span className="font-semibold text-gray-700">
          {slot.buildingName || "Unknown"} — {slot.roomNumber}
        </span>
        <span className="text-[11px] text-gray-400">
          Floor {slot.floor} · Cap {slot.capacity}
        </span>
      </div>

      {slot.departments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {slot.departments.map((d) => (
            <span
              key={d}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getDeptColor(d)}`}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {conflictReason && (
        <div className="flex items-center gap-1.5 rounded bg-orange-100 px-2 py-1 text-[11px] text-orange-700">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {conflictReason}
        </div>
      )}

      {onSelect && (
        <button
          onClick={() => onSelect(slot)}
          disabled={disabled}
          className={`mt-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            selected
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          }`}
        >
          {selected ? "Selected" : "Request This Duty"}
        </button>
      )}
    </div>
  );
}
