import { X } from "lucide-react";
import type { DutySlot } from "../types";

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

interface DutyPreferenceCardProps {
  slot: DutySlot;
  onRemove: () => void;
}

export default function DutyPreferenceCard({ slot, onRemove }: DutyPreferenceCardProps) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-gray-800 px-1 py-0.5 text-[9px] font-bold text-white">
            {slot.examType}
          </span>
          <span className="text-[11px] font-semibold text-gray-700">
            Sem {slot.semester}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-gray-700">
          {slot.buildingName} — {slot.roomNumber}
        </p>
        <p className="text-[10px] text-gray-500">
          {formatDate(slot.date)} · {slot.startTime}–{slot.endTime}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="rounded p-1 text-gray-400 transition-colors hover:bg-blue-100 hover:text-red-500"
        aria-label="Remove from selection"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
