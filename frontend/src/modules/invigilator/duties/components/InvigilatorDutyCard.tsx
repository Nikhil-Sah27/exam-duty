import { Calendar, Clock, DoorOpen } from "lucide-react";
import type { Duty } from "@/modules/duties/types";
import DutySelectionStatus from "./DutySelectionStatus";
import type { DutySelectionState } from "../utils/dutySelectionUtils";

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

interface InvigilatorDutyCardProps {
  duty: Duty;
  state?: DutySelectionState;
  onCancel?: (duty: Duty) => void;
}

/**
 * Compact card for a single invigilator duty. Used wherever a list of
 * a user's selected duties needs to be rendered (e.g. dashboard panel,
 * future "My Duties" view, etc.).
 */
export default function InvigilatorDutyCard({
  duty,
  state = "SELECTED_BY_ME",
  onCancel,
}: InvigilatorDutyCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatDate(duty.date)}
          <span className="text-gray-300">·</span>
          <Clock className="h-3 w-3 text-gray-400" />
          {formatTime(duty.startTime)} – {formatTime(duty.endTime)}
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
          {duty.room}
        </div>
        {duty.exam?.name && (
          <p className="truncate text-[11px] text-gray-400">{duty.exam.name}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <DutySelectionStatus state={state} />
        {onCancel && state === "SELECTED_BY_ME" && (
          <button
            onClick={() => onCancel(duty)}
            className="text-[10px] text-red-500 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
