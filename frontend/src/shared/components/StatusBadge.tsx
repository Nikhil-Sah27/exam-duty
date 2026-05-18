// Legacy status pill kept for backward compatibility. New code should reach
// for `<StatusChip variant=…>` in shared/components/ui, which supports the
// full ChipVariant union (status keys + colour names). This wrapper maps the
// historical 4-variant API onto the same underlying chipVariants table so
// existing call sites pick up the upgraded look (soft ring + dot indicator).

import { chipVariants, type ChipVariant } from "@/shared/theme/componentTokens";

type BadgeVariant = "blue" | "yellow" | "green" | "gray";

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const LEGACY_TO_CHIP: Record<BadgeVariant, ChipVariant> = {
  blue: "upcoming",
  yellow: "ongoing",
  green: "completed",
  gray: "neutral",
};

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  const v = chipVariants[LEGACY_TO_CHIP[variant]];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${v.fill} ${v.text} ${v.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      {label}
    </span>
  );
}
