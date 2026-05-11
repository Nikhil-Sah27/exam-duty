import type { ExamRoomAssignment, DutyStatus } from "../types";
import { getStatusColors } from "../utils/dutyStatusUtils";

const DEPT_COLORS: Record<string, string> = {
  CSE: "bg-blue-100 text-blue-700",
  ECE: "bg-purple-100 text-purple-700",
  ISE: "bg-emerald-100 text-emerald-700",
  ME: "bg-orange-100 text-orange-700",
  MECH: "bg-orange-100 text-orange-700",
  CE: "bg-amber-100 text-amber-700",
  EEE: "bg-rose-100 text-rose-700",
  AIML: "bg-indigo-100 text-indigo-700",
  MBA: "bg-teal-100 text-teal-700",
};

function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept.toUpperCase()] || "bg-gray-100 text-gray-600";
}

interface RoomChipProps {
  assignment: ExamRoomAssignment;
  status: DutyStatus;
  onClick: () => void;
}

export default function RoomChip({ assignment, status, onClick }: RoomChipProps) {
  const { room, departments } = assignment;
  const buildingName = room.building?.name || "Unknown";
  const colors = getStatusColors(status);

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-all ${colors.border} ${colors.bg}`}
    >
      {/* Status dot */}
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />

      {/* Room info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800">
          {buildingName} — {room.roomNumber}
        </p>
        <p className="text-[11px] text-gray-400">
          Floor {room.floor} · Cap {room.capacity}
        </p>
      </div>

      {/* Department badges */}
      {departments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {departments.map((dept) => (
            <span
              key={dept}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getDeptColor(dept)}`}
            >
              {dept}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
