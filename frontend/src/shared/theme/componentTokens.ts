// High-level mappings used by primitive components. Consumers import from
// here (or from the matching `colors`/`gradients` files) instead of building
// their own variant maps inline.

import type { StatusKey } from "./colors";

export type ChipVariant =
  | StatusKey
  | "neutral"
  | "violet"
  | "indigo"
  | "sky"
  | "rose"
  | "amber"
  | "emerald";

/**
 * Variant → Tailwind classes for the StatusChip primitive. Uses soft fills
 * with matching ring + text colour so the chip reads as a tag, not a button.
 */
export const chipVariants: Record<
  ChipVariant,
  { fill: string; text: string; dot: string; ring: string }
> = {
  ongoing: { fill: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" },
  upcoming: { fill: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", ring: "ring-blue-200" },
  completed: { fill: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  cancelled: { fill: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-200" },
  neutral: { fill: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500", ring: "ring-gray-200" },
  violet: { fill: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", ring: "ring-violet-200" },
  indigo: { fill: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", ring: "ring-indigo-200" },
  sky: { fill: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", ring: "ring-sky-200" },
  rose: { fill: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-200" },
  amber: { fill: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" },
  emerald: { fill: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
};

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

/**
 * Variant → Tailwind classes for the GradientButton primitive. The shared
 * `Button` component delegates to these so existing callers keep their
 * variant names but get the upgraded look automatically.
 */
export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
  danger:
    "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm hover:from-rose-700 hover:to-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
};
