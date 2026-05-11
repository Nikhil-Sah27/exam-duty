import { ExamGroupDetails, ExamGroupStatus } from "../types";
import { Calendar } from "lucide-react";
import { formatDate } from "@/shared/lib/utils";

interface ExamHeaderProps {
  group: ExamGroupDetails;
  status: ExamGroupStatus;
}

const TYPE_COLORS: Record<string, string> = {
  IA1: "bg-violet-600",
  IA2: "bg-indigo-600",
  IA3: "bg-blue-600",
  SEE: "bg-rose-600",
};

const STATUS_STYLES: Record<
  ExamGroupStatus,
  { bg: string; text: string; dot: string }
> = {
  upcoming: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  ongoing: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
};

export default function ExamHeader({ group, status }: ExamHeaderProps) {
  const typeColor = TYPE_COLORS[group.examType] || "bg-gray-800";
  const statusStyle = STATUS_STYLES[status];

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
