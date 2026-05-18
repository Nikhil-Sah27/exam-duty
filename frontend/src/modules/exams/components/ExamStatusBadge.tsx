import type { ExamGroupStatus } from "../types";

interface ExamStatusBadgeProps {
  status: ExamGroupStatus;
  size?: "sm" | "md";
}

const STYLES: Record<ExamGroupStatus, { bg: string; text: string; dot: string; label: string }> = {
  ongoing: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Ongoing",
  },
  upcoming: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Upcoming",
  },
  completed: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Completed",
  },
};

// Single source of truth for status colors across the Exams module —
// imported by both CIE and SEE cards so a future palette change happens
// in one file.
export default function ExamStatusBadge({ status, size = "sm" }: ExamStatusBadgeProps) {
  const s = STYLES[status];
  const sizing =
    size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizing} ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
