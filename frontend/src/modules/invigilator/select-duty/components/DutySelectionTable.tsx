import { CheckCircle2, Lock } from "lucide-react";
import type { DutySlot, SlotState } from "../types";

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

interface DutySelectionTableProps {
  slots: DutySlot[];
  stateOf: (slot: DutySlot) => SlotState;
  onToggle: (slot: DutySlot) => void;
}

export default function DutySelectionTable({
  slots,
  stateOf,
  onToggle,
}: DutySelectionTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3 font-semibold">Exam</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Room</th>
            <th className="px-4 py-3 font-semibold">Depts</th>
            <th className="px-4 py-3 font-semibold">Cap</th>
            <th className="px-4 py-3 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const state = stateOf(slot);
            const isSelected = state === "SELECTED";
            const isFull = state === "FULL";
            return (
              <tr key={slot.slotId} className="border-b border-gray-50 last:border-b-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {slot.examType}
                    </span>
                    <span className="text-xs text-gray-500">Sem {slot.semester}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700">
                  {formatDate(slot.date)}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700">
                  {slot.startTime} – {slot.endTime}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <span className="font-medium text-gray-700">
                    {slot.buildingName} — {slot.roomNumber}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {slot.departments.join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{slot.capacity}</td>
                <td className="px-4 py-2.5 text-right">
                  {isFull ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                      <Lock className="h-3 w-3" /> Full
                    </span>
                  ) : (
                    <button
                      onClick={() => onToggle(slot)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Selected
                        </span>
                      ) : (
                        "Select"
                      )}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {slots.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                No slots match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
