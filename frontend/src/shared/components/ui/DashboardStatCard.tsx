import { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import GradientCard from "./GradientCard";
import { gradients, type GradientVariant } from "@/shared/theme/gradients";

interface DashboardStatCardProps {
  /** Theme variant (controls accent + soft bg gradient). */
  variant?: GradientVariant;
  label: string;
  value: ReactNode;
  /** Optional Lucide icon node, e.g. `<Users />`. */
  icon?: ReactNode;
  /** Optional trend percentage. Positive = up, negative = down. */
  trend?: number;
  /** Optional secondary line under the value (e.g. "vs last week"). */
  hint?: string;
}

/**
 * Premium stat tile used on dashboards. Wraps GradientCard so consumers can
 * drop it into a `grid grid-cols-2 lg:grid-cols-4 gap-4` and get consistent
 * vibrant tiles. The `variant` controls both the soft surface gradient and
 * the icon-chip's accent colour.
 */
export default function DashboardStatCard({
  variant = "stat",
  label,
  value,
  icon,
  trend,
  hint,
}: DashboardStatCardProps) {
  const accent = gradients[variant].accent;
  const accentText = gradients[variant].accentText;
  const positive = (trend ?? 0) >= 0;
  return (
    <GradientCard variant={variant} interactive={false} className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent} ${accentText} shadow-sm`}
          >
            {icon}
          </div>
        )}
      </div>
      {typeof trend === "number" && (
        <p
          className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
            positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {positive ? "+" : ""}
          {trend}%
        </p>
      )}
    </GradientCard>
  );
}
