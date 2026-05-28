import { ReactNode } from "react";
import type { ExamGroup, ExamGroupStatus } from "../types/exam.types";

interface ExamStatusSectionProps {
  status: ExamGroupStatus;
  exams: ExamGroup[];
  /**
   * Renders one card per exam. Decoupled so the same status section can render
   * either the admin or invigilator-flavour card without prop drilling.
   */
  renderCard: (group: ExamGroup) => ReactNode;
  /**
   * Hide the section header (used when the parent already labels the band).
   * Default: header is shown.
   */
  hideHeader?: boolean;
}

const STATUS_LABEL: Record<ExamGroupStatus, string> = {
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  completed: "Completed",
};

// Status colours per spec: Ongoing → Orange/Amber, Upcoming → Blue,
// Completed → Green, Cancelled → Red. Cancelled is not produced by the
// status helper today, but the palette is kept here for forward compat.
const STATUS_DOT: Record<ExamGroupStatus, string> = {
  ongoing: "bg-amber-500",
  upcoming: "bg-blue-500",
  completed: "bg-green-500",
};

/**
 * One status band (Ongoing / Upcoming / Completed) inside an exam-type
 * section. Renders nothing when empty so callers can drop a single
 * component per status and let it self-hide.
 */
export default function ExamStatusSection({
  status,
  exams,
  renderCard,
  hideHeader = false,
}: ExamStatusSectionProps) {
  if (exams.length === 0) return null;

  return (
    <div className="space-y-3">
      {!hideHeader && (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {STATUS_LABEL[status]}
          </h4>
          <span className="text-xs text-gray-400">({exams.length})</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exams.map(renderCard)}
      </div>
    </div>
  );
}
