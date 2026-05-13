import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  DoorOpen,
} from "lucide-react";
import type {
  ExamGroup,
  ExamGroupStatus,
} from "@/modules/shared/exams/types/exam.types";
import {
  getStatusStyle,
  getTypeColor,
} from "@/modules/shared/exams/utils/examStatusUtils";

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

interface InvigilatorExamCardProps {
  group: ExamGroup;
  status: ExamGroupStatus;
}

export default function InvigilatorExamCard({
  group,
  status,
}: InvigilatorExamCardProps) {
  const statusStyle = getStatusStyle(status);
  const typeColor = getTypeColor(group.examType);

  return (
    <Link
      to={group._id}
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
        <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
      </div>

      <div className="mt-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

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
