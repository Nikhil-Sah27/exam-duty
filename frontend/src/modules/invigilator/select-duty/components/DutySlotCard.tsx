import { Calendar, Clock, DoorOpen, CheckCircle2, Lock } from "lucide-react";
import type { DutySlot, SlotState } from "../types";

const STATE_STYLES: Record<SlotState, { border: string; bg: string; label: string; labelColor: string }> = {
  AVAILABLE: {
    border: "border-green-300",
    bg: "bg-white hover:bg-green-50",
    label: "Available",
    labelColor: "text-green-700",
  },
  SELECTED: {
    border: "border-blue-500 ring-2 ring-blue-200",
    bg: "bg-blue-50",
    label: "Selected",
    labelColor: "text-blue-700",
  },
  FULL: {
    border: "border-red-200",
    bg: "bg-red-50/40 opacity-60 cursor-not-allowed",
    label: "Full",
    labelColor: "text-red-600",
  },
};

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

interface DutySlotCardProps {
  slot: DutySlot;
  state: SlotState;
  onToggle: () => void;
}

export default function DutySlotCard({ slot, state, onToggle }: DutySlotCardProps) {
  const styles = STATE_STYLES[state];
  const disabled = state === "FULL";

  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all ${styles.border} ${styles.bg}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
            {slot.examType}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
            Sem {slot.semester}
          </span>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-semibold ${styles.labelColor}`}>
          {state === "SELECTED" && <CheckCircle2 className="h-3 w-3" />}
          {state === "FULL" && <Lock className="h-3 w-3" />}
          {styles.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600">
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
          {slot.buildingName} — {slot.roomNumber}
        </span>
        <span className="text-[11px] text-gray-400">cap {slot.capacity}</span>
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
    </button>
  );
}
