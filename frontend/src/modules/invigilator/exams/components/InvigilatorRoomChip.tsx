import { Sparkles, Lock, CheckCircle2 } from "lucide-react";
import type { ExamRoomAssignment, RoomDutyFlags } from "@/modules/exams/types";
import { useAssignmentStatus } from "@/modules/shared/hooks/useAssignmentStatus";
import {
  getTeacherStatusLabel,
  type OperationalRoleKey,
} from "@/modules/shared/utils/assignmentStatusUtils";

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

interface InvigilatorRoomChipProps {
  assignment: ExamRoomAssignment;
  flags: RoomDutyFlags | undefined;
  viewerRole: OperationalRoleKey;
  isMine: boolean;
  /** Viewer has another assigned duty whose time overlaps this slot. */
  hasConflict?: boolean;
  onClick: () => void;
}

/**
 * Teacher-perspective room chip. Green = Available for the viewer's role,
 * Blue = the viewer owns it, Red = another teacher in that role is already
 * assigned. CS perspective lives in `modules/exams/components/RoomChip` and
 * is left untouched.
 */
export default function InvigilatorRoomChip({
  assignment,
  flags,
  viewerRole,
  isMine,
  hasConflict,
  onClick,
}: InvigilatorRoomChipProps) {
  const { room, departments } = assignment;
  const buildingName = room.building?.name || "Unknown";
  const { status, paint } = useAssignmentStatus({
    flags,
    viewerRole,
    isMine,
    hasConflict,
  });

  const tooltipLines = [
    `${buildingName} — ${room.roomNumber}`,
    `Status: ${getTeacherStatusLabel(status)}`,
  ];
  if (status === "OCCUPIED") {
    const assignee =
      viewerRole === "dcs"
        ? flags?.dcsTeacher
        : viewerRole === "rs"
          ? flags?.rsTeacher
          : flags?.invigilatorTeacher;
    if (assignee) {
      tooltipLines.push(`Assigned to ${assignee.name}`);
      if (assignee.department) tooltipLines.push(assignee.department);
      if (assignee.phone) tooltipLines.push(assignee.phone);
    }
  }

  return (
    <button
      onClick={onClick}
      title={tooltipLines.join("\n")}
      className={`group/chip flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left shadow-sm transition-all hover:-translate-y-px hover:shadow-md ${paint.border} ${paint.bg}`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${paint.dot}`} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800">
          {buildingName} — {room.roomNumber}
        </p>
        <p className={`text-[11px] ${paint.text}`}>
          {status === "AVAILABLE" && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Available · Floor {room.floor} · Cap {room.capacity}
            </span>
          )}
          {status === "MINE" && (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              My duty · Floor {room.floor} · Cap {room.capacity}
            </span>
          )}
          {status === "OCCUPIED" && (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Occupied · Floor {room.floor} · Cap {room.capacity}
            </span>
          )}
          {status === "CONFLICT" && (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Conflict · Floor {room.floor} · Cap {room.capacity}
            </span>
          )}
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
    </button>
  );
}
