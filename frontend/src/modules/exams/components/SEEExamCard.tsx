import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  Trash2,
} from "lucide-react";
import { ExamGroup, ExamGroupStatus } from "../types";
import ExamStatusBadge from "./ExamStatusBadge";

interface SEEExamCardProps {
  group: ExamGroup;
  status: ExamGroupStatus;
  onDelete: (group: ExamGroup) => void;
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

// Premium variant for SEE (Semester End Exam). Differentiates from CIE cards
// through:
//   • rose-toned gradient background overlay
//   • thicker, deeper border colour
//   • larger, gradient SEE badge with a graduation-cap icon
//   • soft rose glow on hover so the row visually "lifts" above CIE cards
//
// Matches the existing card geometry (same padding, status badge, stat grid)
// so the design system stays coherent.
export default function SEEExamCard({ group, status, onDelete }: SEEExamCardProps) {
  return (
    <Link
      to={`/exams/${group._id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-rose-300 bg-gradient-to-br from-rose-50/70 via-white to-white p-5 shadow-[0_0_0_1px_rgba(244,63,94,0.05)] transition-all hover:border-rose-400 hover:shadow-lg hover:shadow-rose-100"
    >
      {/* Decorative accent stripe along the top */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-rose-600 to-fuchsia-600"
        aria-hidden
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-br from-rose-600 to-fuchsia-700 px-3 py-1.5 text-sm font-extrabold tracking-wide text-white shadow-sm">
            <GraduationCap className="h-4 w-4" />
            SEE
          </span>
          <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
            Sem {group.semester}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(group);
            }}
            className="rounded-md p-1.5 text-rose-300 opacity-0 transition-all hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
            title="Delete SEE exam"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-rose-300 transition-colors group-hover:text-rose-500" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <ExamStatusBadge status={status} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-rose-500/70">
          External Exam
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-rose-100 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-3.5 w-3.5 text-rose-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">{group.totalSchedules}</p>
            <p className="text-[10px] text-gray-400">Schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DoorOpen className="h-3.5 w-3.5 text-fuchsia-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">{group.totalRooms}</p>
            <p className="text-[10px] text-gray-400">Rooms</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-500/80">
        <Calendar className="h-3 w-3" />
        {formatDateShort(group.startDate)} – {formatDateShort(group.endDate)}
      </div>
    </Link>
  );
}
