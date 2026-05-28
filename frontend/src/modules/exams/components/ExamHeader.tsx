import { ExamGroupDetails, ExamGroupStatus } from "../types";
import { Calendar } from "lucide-react";
import { formatDate } from "@/shared/lib/utils";
import {
  getStatusStyle,
  getTypeColor,
} from "@/modules/shared/exams/utils/examStatusUtils";

interface ExamHeaderProps {
  group: ExamGroupDetails;
  status: ExamGroupStatus;
}

export default function ExamHeader({ group, status }: ExamHeaderProps) {
  const typeColor = getTypeColor(group.examType);
  const statusStyle = getStatusStyle(status);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-lg px-3 py-1.5 text-sm font-bold text-white ${typeColor}`}
        >
          {group.examType}
        </span>
        <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700">
          Semester {group.semester}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
          />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Calendar className="h-4 w-4" />
        {formatDate(group.startDate)} – {formatDate(group.endDate)}
      </div>
    </div>
  );
}
