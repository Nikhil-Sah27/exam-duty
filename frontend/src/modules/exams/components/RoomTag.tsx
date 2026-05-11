import { ExamRoomAssignment } from "../types";

interface RoomTagProps {
  assignment: ExamRoomAssignment;
}

const DEPT_COLORS: Record<string, string> = {
  CSE: "bg-blue-50 text-blue-700",
  ECE: "bg-purple-50 text-purple-700",
  ISE: "bg-emerald-50 text-emerald-700",
  ME: "bg-orange-50 text-orange-700",
  CE: "bg-amber-50 text-amber-700",
  EEE: "bg-rose-50 text-rose-700",
  AIML: "bg-indigo-50 text-indigo-700",
  MBA: "bg-teal-50 text-teal-700",
};

function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept.toUpperCase()] || "bg-gray-50 text-gray-600";
}

export default function RoomTag({ assignment }: RoomTagProps) {
  const { room, departments } = assignment;
  const buildingName = room.building?.name || "Unknown";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">
          {buildingName} — {room.roomNumber}
        </p>
        <p className="text-[11px] text-gray-400">
          Floor {room.floor} · Cap {room.capacity}
        </p>
      </div>
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
    </div>
  );
}
