import type { DashboardRoleLabel } from "./types";

/**
 * The role palette from the web dashboards, flattened to solid colors.
 *
 * The web uses Tailwind gradients (`from-emerald-500 via-teal-500 …`); there is
 * no gradient primitive in React Native core and expo-linear-gradient is not a
 * dependency here, so each gradient collapses to its mid stop. The role a
 * teacher is looking at still reads at a glance, which is what the color is for.
 */

export interface RoleTheme {
  /** Hero band background. */
  hero: string;
  /** Card surface + border. */
  cardBackground: string;
  cardBorder: string;
  /** Role pill on a card. */
  pill: string;
  /** Single-character glyph standing in for the web's lucide role icon. */
  glyph: string;
}

export const ROLE_THEMES: Record<DashboardRoleLabel, RoleTheme> = {
  Invigilator: {
    hero: "#0d9488",
    cardBackground: "#ecfdf5",
    cardBorder: "#a7f3d0",
    pill: "#10b981",
    glyph: "✓",
  },
  RS: {
    hero: "#ea580c",
    cardBackground: "#fff7ed",
    cardBorder: "#fed7aa",
    pill: "#f59e0b",
    glyph: "⛨",
  },
  DCS: {
    hero: "#4f46e5",
    cardBackground: "#eef2ff",
    cardBorder: "#c7d2fe",
    pill: "#6366f1",
    glyph: "★",
  },
};

/** Department chip colors, copied from the web's DashboardDutyCard. */
const DEPT_COLORS: Record<string, { background: string; text: string }> = {
  CSE: { background: "#dbeafe", text: "#1d4ed8" },
  ECE: { background: "#f3e8ff", text: "#7e22ce" },
  ISE: { background: "#d1fae5", text: "#047857" },
  ME: { background: "#ffedd5", text: "#c2410c" },
  MECH: { background: "#ffedd5", text: "#c2410c" },
  CE: { background: "#fef3c7", text: "#b45309" },
  EEE: { background: "#ffe4e6", text: "#be123c" },
  AIML: { background: "#e0e7ff", text: "#4338ca" },
};

const DEPT_FALLBACK = { background: "#f1f5f9", text: "#475569" };

export function getDeptColor(dept: string): { background: string; text: string } {
  return DEPT_COLORS[dept.toUpperCase()] ?? DEPT_FALLBACK;
}
