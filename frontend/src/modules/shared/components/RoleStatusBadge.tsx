import {
  CheckCircle2,
  Crown,
  Info,
  Lock,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  getRoleDisplayLabel,
  getRoleDisplayPaint,
  type RoleDisplayState,
} from "../utils/roleAssignmentUtils";

/**
 * Pill rendered inside RoleAssignmentCard. Distinct from
 * AssignmentStatusBadge because it speaks the role-display vocabulary
 * (OWNED / OPEN / BLOCKED / INFO_ASSIGNED / INFO_VACANT) rather than the
 * coarser teacher-perspective status — that's what gives the same row two
 * different paints depending on whether it's the viewer's role or not.
 */
const ICON: Record<RoleDisplayState, typeof CheckCircle2> = {
  OWNED: Sparkles,
  OPEN: CheckCircle2,
  BLOCKED: Lock,
  INFO_ASSIGNED: UserCheck,
  INFO_VACANT: Info,
};

const FALLBACK_ICON = Crown; // unused; ICON above is exhaustive

interface RoleStatusBadgeProps {
  state: RoleDisplayState;
  label?: string;
  size?: "sm" | "md";
}

export default function RoleStatusBadge({
  state,
  label,
  size = "sm",
}: RoleStatusBadgeProps) {
  const paint = getRoleDisplayPaint(state);
  const Icon = ICON[state] ?? FALLBACK_ICON;
  const text = label ?? getRoleDisplayLabel(state);

  const sizing =
    size === "md"
      ? "px-3 py-1 text-xs"
      : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white shadow-sm ${paint.pill} ${sizing}`}
    >
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}
