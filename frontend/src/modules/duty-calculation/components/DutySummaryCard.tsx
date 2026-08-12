import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

export type DutySummaryTone = "target" | "completed" | "remaining";

const TONE_STYLES: Record<
  DutySummaryTone,
  {
    gradient: string;
    iconBg: string;
    iconColor: string;
    ring: string;
  }
> = {
  target: {
    gradient: "from-blue-500 via-indigo-500 to-blue-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-blue-200",
  },
  completed: {
    gradient: "from-emerald-500 via-teal-500 to-emerald-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-emerald-200",
  },
  remaining: {
    gradient: "from-orange-500 via-amber-500 to-rose-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-amber-200",
  },
};

interface DutySummaryCardProps {
  tone: DutySummaryTone;
  label: string;
  value: number | string;
  description: string;
  icon: ComponentType<LucideProps>;
  /** Rendered inside a tooltip on hover / focus (native `title` fallback used). */
  tooltip?: ReactNode;
  /** Optional tooltip title used when `tooltip` isn't a React node. */
  tooltipTitle?: string;
}

/**
 * A single stat card in the invigilator dashboard. All three cards share the
 * same shape so the row reads cleanly; the tone prop swaps the gradient +
 * accent colours.
 *
 * Tooltip: shown on hover (and on focus for keyboard/pointer parity). Kept
 * inline so no positioning library is needed — grows the card downward with
 * a small floating panel.
 */
export default function DutySummaryCard({
  tone,
  label,
  value,
  description,
  icon: Icon,
  tooltip,
  tooltipTitle,
}: DutySummaryCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div className="group relative">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg ring-1 ${styles.gradient} ${styles.ring}`}
        title={tooltipTitle}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
              {label}
            </p>
            <p className="mt-1 text-4xl font-extrabold leading-none">{value}</p>
            <p className="mt-2 text-xs text-white/85">{description}</p>
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl backdrop-blur-sm ${styles.iconBg}`}
            aria-hidden
          >
            <Icon className={`h-5 w-5 ${styles.iconColor}`} />
          </div>
        </div>
      </div>

      {tooltip && (
        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg group-hover:block group-focus-within:block">
          {tooltip}
        </div>
      )}
    </div>
  );
}
