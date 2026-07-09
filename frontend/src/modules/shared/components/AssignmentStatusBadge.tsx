import {
  CheckCircle2,
  Crown,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import {
  getTeacherStatusLabel,
  getTeacherStatusPaint,
  type TeacherAssignmentStatus,
} from "../utils/assignmentStatusUtils";

const ICON: Record<TeacherAssignmentStatus, typeof CheckCircle2> = {
  AVAILABLE: CheckCircle2,
  MINE: Sparkles,
  OCCUPIED: Crown,
  CONFLICT: ShieldAlert,
};

interface AssignmentStatusBadgeProps {
  status: TeacherAssignmentStatus;
  /** Optional label override — defaults to the status label. */
  label?: string;
  size?: "sm" | "md";
}

/**
 * Theme-consistent pill used across teacher dashboards. Gradient backgrounds
 * + icon + label form a single component so every surface (chip, modal,
 * upcoming-duties card) shows status the same way.
 */
export default function AssignmentStatusBadge({
  status,
  label,
  size = "sm",
}: AssignmentStatusBadgeProps) {
  const paint = getTeacherStatusPaint(status);
  const Icon = ICON[status];
  const text = label ?? getTeacherStatusLabel(status);

  const sizing =
    size === "md"
      ? "px-3 py-1 text-xs"
      : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white shadow-sm ${paint.gradient} ${sizing}`}
    >
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}
