import { Link } from "react-router-dom";
import { Calendar, ChevronRight, ClipboardList, DoorOpen, Trash2 } from "lucide-react";
import { ExamGroup, ExamGroupStatus } from "../types";
import ExamStatusBadge from "./ExamStatusBadge";

interface CIEExamCardProps {
  group: ExamGroup;
  status: ExamGroupStatus;
  onDelete: (group: ExamGroup) => void;
}

// Per-exam-type colour for the small IA1/IA2/IA3 badge. SEE has its own
// card variant (SEEExamCard) so it isn't represented here.
const IA_BADGE_COLOR: Record<string, string> = {
  IA1: "bg-violet-600",
  IA2: "bg-indigo-600",
  IA3: "bg-sky-600",
};

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function CIEExamCard({ group, status, onDelete }: CIEExamCardProps) {
  const typeColor = IA_BADGE_COLOR[group.examType] || "bg-gray-700";

  return (
    <Link
      to={`/exams/${group._id}`}
      className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold tracking-wide text-white ${typeColor}`}
          >
            {group.examType}
          </span>
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
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
            className="rounded-md p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            title="Delete exam group"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
        </div>
      </div>

      <div className="mt-3">
        <ExamStatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">{group.totalSchedules}</p>
            <p className="text-[10px] text-gray-400">Schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DoorOpen className="h-3.5 w-3.5 text-purple-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">{group.totalRooms}</p>
            <p className="text-[10px] text-gray-400">Rooms</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
        <Calendar className="h-3 w-3" />
        {formatDateShort(group.startDate)} – {formatDateShort(group.endDate)}
      </div>
    </Link>
  );
}
