import { CheckCircle2, Lock, AlertTriangle } from "lucide-react";
import type { RSDutyGroup, RSGroupState } from "../types";

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

interface RSDutyGroupTableProps {
  groups: RSDutyGroup[];
  stateOf: (g: RSDutyGroup) => RSGroupState;
  onToggle: (g: RSDutyGroup) => void;
}

/**
 * Table view of RS groups, parallel to invigilator's DutySelectionTable.
 * Same columns + the same "Action" trailing button so the table toggle in
 * the page header behaves consistently across roles.
 */
export default function RSDutyGroupTable({
  groups,
  stateOf,
  onToggle,
}: RSDutyGroupTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3 font-semibold">Exam</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Block — Rooms</th>
            <th className="px-4 py-3 font-semibold">Depts</th>
            <th className="px-4 py-3 font-semibold">Count</th>
            <th className="px-4 py-3 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const state = stateOf(g);
            const isSelected = state === "SELECTED";
            const isFull = state === "FULL";
            const isConflict = state === "CONFLICT";
            const disabled = isFull || isConflict;
            return (
              <tr key={g.groupId} className="border-b border-gray-50 last:border-b-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {g.examType}
                    </span>
                    <span className="text-xs text-gray-500">Sem {g.semester}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700">
                  {formatDate(g.date)}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700">
                  {g.startTime} – {g.endTime}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <span className="font-medium text-gray-700">
                    {g.buildingName} — {g.rangeLabel}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {g.departments.join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {g.rooms.length}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {isFull ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                      <Lock className="h-3 w-3" /> Full
                    </span>
                  ) : isConflict ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      <AlertTriangle className="h-3 w-3" /> Conflict
                    </span>
                  ) : (
                    <button
                      onClick={() => !disabled && onToggle(g)}
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
                        "Select Group"
                      )}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {groups.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                No room groups match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
