import { ROLE_BADGE_COLORS, ROLE_LABELS } from "@/shared/constants/roles";
import type { UserRole } from "@/shared/lib/types";

interface Props {
  role: UserRole;
  className?: string;
}

// Small reusable pill component so multi-role display is consistent everywhere.
export default function RoleBadge({ role, className = "" }: Props) {
  const color = ROLE_BADGE_COLORS[role] || "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
