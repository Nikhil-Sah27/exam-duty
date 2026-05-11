import { Link } from "react-router-dom";
import { Calendar, ChevronRight, ClipboardList, DoorOpen, Trash2 } from "lucide-react";
import { ExamGroup, ExamGroupStatus } from "../types";

interface ExamCardProps {
  group: ExamGroup;
  status: ExamGroupStatus;
  onDelete: (group: ExamGroup) => void;
}

const STATUS_STYLES: Record<ExamGroupStatus, { bg: string; text: string; dot: string }> = {
  upcoming: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  ongoing: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

const TYPE_COLORS: Record<string, string> = {
  IA1: "bg-violet-600",
  IA2: "bg-indigo-600",
  IA3: "bg-blue-600",
  SEE: "bg-rose-600",
};

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function ExamCard({ group, status, onDelete }: ExamCardProps) {
  const statusStyle = STATUS_STYLES[status];
  const typeColor = TYPE_COLORS[group.examType] || "bg-gray-800";

  return (
    <Link
      to={`/exams/${group._id}`}
      className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md"
    >
      {/* Header row */}
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
          {/* Delete button */}
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

      {/* Status badge */}
      <div className="mt-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">
              {group.totalSchedules}
            </p>
            <p className="text-[10px] text-gray-400">Schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DoorOpen className="h-3.5 w-3.5 text-purple-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">
              {group.totalRooms}
            </p>
            <p className="text-[10px] text-gray-400">Rooms</p>
          </div>
        </div>
      </div>

      {/* Date range */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
        <Calendar className="h-3 w-3" />
        {formatDateShort(group.startDate)} – {formatDateShort(group.endDate)}
      </div>
    </Link>
  );
}
