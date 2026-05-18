import { ReactNode } from "react";
import { ExamGroup, ExamGroupStatus } from "../types";

interface ExamStatusGroupProps {
  status: ExamGroupStatus;
  exams: ExamGroup[];
  /**
   * Renders one card per exam. Decoupled so the same status group can render
   * either CIEExamCard or SEEExamCard without prop drilling.
   */
  renderCard: (group: ExamGroup) => ReactNode;
}

const STATUS_LABEL: Record<ExamGroupStatus, string> = {
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  completed: "Completed",
};

const STATUS_DOT: Record<ExamGroupStatus, string> = {
  ongoing: "bg-amber-500",
  upcoming: "bg-blue-500",
  completed: "bg-green-500",
};

// One status bucket inside a category section. Renders nothing when the
// bucket is empty so callers can drop a single component per status and
// rely on it to handle visibility.
export default function ExamStatusGroup({
  status,
  exams,
  renderCard,
}: ExamStatusGroupProps) {
  if (exams.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {STATUS_LABEL[status]}
        </h4>
        <span className="text-xs text-gray-400">({exams.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exams.map(renderCard)}
      </div>
    </div>
  );
}
