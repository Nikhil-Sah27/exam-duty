// Gradient classes used across the design system. Keep values as full Tailwind
// class strings so consumers can paste them directly into `className`. Every
// gradient has a `bg` (the surface) and an `accent` (the deeper version used
// on badges / accent stripes / buttons of that variant).

export type GradientVariant =
  | "see"
  | "cie"
  | "department"
  | "building"
  | "room"
  | "teacher"
  | "duty"
  | "schedule"
  | "stat"
  | "notification"
  | "neutral";

interface GradientPair {
  /** Soft surface gradient used for cards. */
  bg: string;
  /** Stronger gradient used for badges, buttons, and accent stripes. */
  accent: string;
  /** Text colour that reads well on `accent`. */
  accentText: string;
  /** Subtle ring/border colour for outlined variants. */
  ring: string;
}

export const gradients: Record<GradientVariant, GradientPair> = {
  // SEE — premium / external exams (kept matching the SEEExamCard look)
  see: {
    bg: "bg-gradient-to-br from-rose-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-rose-600 to-fuchsia-700",
    accentText: "text-white",
    ring: "ring-rose-200",
  },
  // CIE — internal exams
  cie: {
    bg: "bg-gradient-to-br from-indigo-50/60 via-white to-white",
    accent: "bg-gradient-to-br from-indigo-600 to-violet-700",
    accentText: "text-white",
    ring: "ring-indigo-200",
  },
  // Departments — blue → cyan
  department: {
    bg: "bg-gradient-to-br from-blue-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-blue-600 to-cyan-600",
    accentText: "text-white",
    ring: "ring-blue-200",
  },
  // Buildings — orange → amber
  building: {
    bg: "bg-gradient-to-br from-amber-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-orange-500 to-amber-500",
    accentText: "text-white",
    ring: "ring-amber-200",
  },
  // Rooms — emerald → green
  room: {
    bg: "bg-gradient-to-br from-emerald-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-emerald-600 to-green-600",
    accentText: "text-white",
    ring: "ring-emerald-200",
  },
  // Teachers — rose → pink
  teacher: {
    bg: "bg-gradient-to-br from-pink-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-rose-500 to-pink-600",
    accentText: "text-white",
    ring: "ring-pink-200",
  },
  // Duties — violet → purple
  duty: {
    bg: "bg-gradient-to-br from-violet-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-violet-600 to-purple-700",
    accentText: "text-white",
    ring: "ring-violet-200",
  },
  // Schedules — sky → blue
  schedule: {
    bg: "bg-gradient-to-br from-sky-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-sky-500 to-blue-600",
    accentText: "text-white",
    ring: "ring-sky-200",
  },
  // Stats — teal → cyan
  stat: {
    bg: "bg-gradient-to-br from-teal-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-teal-500 to-cyan-600",
    accentText: "text-white",
    ring: "ring-teal-200",
  },
  // Notifications — amber → orange
  notification: {
    bg: "bg-gradient-to-br from-amber-50/70 via-white to-white",
    accent: "bg-gradient-to-br from-amber-500 to-orange-600",
    accentText: "text-white",
    ring: "ring-amber-200",
  },
  // Neutral fallback — used when a surface has no semantic variant yet.
  neutral: {
    bg: "bg-white",
    accent: "bg-gradient-to-br from-gray-700 to-gray-900",
    accentText: "text-white",
    ring: "ring-gray-200",
  },
};
