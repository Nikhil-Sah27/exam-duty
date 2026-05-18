import { ReactNode } from "react";
import { chipVariants, type ChipVariant } from "@/shared/theme/componentTokens";

interface StatusChipProps {
  variant: ChipVariant;
  /** Defaults to `md`. Use `sm` when chip needs to fit in dense table rows. */
  size?: "sm" | "md";
  /** Optional leading dot indicator (shown for status-like variants). */
  withDot?: boolean;
  /** Optional icon — overrides `withDot` when present. */
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Centralised pill primitive. Consumers should prefer this over the legacy
 * `StatusBadge` for new code. Supports `ChipVariant` (status keys plus a
 * neutral / colour-named set for chips that don't map to a status).
 */
export default function StatusChip({
  variant,
  size = "md",
  withDot = true,
  icon,
  children,
}: StatusChipProps) {
  const v = chipVariants[variant];
  const sizing =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ${v.fill} ${v.text} ${v.ring} ${sizing}`}
    >
      {icon ? (
        <span className="flex h-3 w-3 items-center justify-center">{icon}</span>
      ) : withDot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      ) : null}
      {children}
    </span>
  );
}
