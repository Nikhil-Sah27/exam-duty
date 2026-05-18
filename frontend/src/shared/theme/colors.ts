// Semantic colour tokens. We don't try to override Tailwind's palette —
// we just map domain concepts (exam type, status) to the Tailwind class
// fragments components use. Keeps colour decisions out of the components
// themselves.

export type StatusKey = "ongoing" | "upcoming" | "completed" | "cancelled";

interface StatusPalette {
  /** Soft fill used by chips. */
  fill: string;
  /** Text colour that reads well on `fill`. */
  text: string;
  /** Indicator dot colour. */
  dot: string;
  /** Border / ring used for outlined status surfaces. */
  ring: string;
  /** Gradient accent used by larger status surfaces (e.g. ExamStatusBadge size="md"). */
  accent: string;
}

export const statusColors: Record<StatusKey, StatusPalette> = {
  ongoing: {
    fill: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    accent: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
  upcoming: {
    fill: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
    accent: "bg-gradient-to-r from-blue-500 to-sky-500",
  },
  completed: {
    fill: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
    accent: "bg-gradient-to-r from-emerald-500 to-green-500",
  },
  cancelled: {
    fill: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    ring: "ring-rose-200",
    accent: "bg-gradient-to-r from-rose-500 to-red-500",
  },
};

export type ExamTypeKey = "IA1" | "IA2" | "IA3" | "SEE";

/**
 * Per-exam-type accent gradient + ring. SEE intentionally stays the most
 * visually distinctive (matches the SEEExamCard's rose→fuchsia accent).
 */
export const examTypeColors: Record<ExamTypeKey, { accent: string; ring: string }> = {
  IA1: { accent: "bg-gradient-to-br from-violet-600 to-violet-700", ring: "ring-violet-200" },
  IA2: { accent: "bg-gradient-to-br from-indigo-600 to-indigo-700", ring: "ring-indigo-200" },
  IA3: { accent: "bg-gradient-to-br from-sky-600 to-sky-700", ring: "ring-sky-200" },
  SEE: { accent: "bg-gradient-to-br from-rose-600 to-fuchsia-700", ring: "ring-rose-200" },
};
