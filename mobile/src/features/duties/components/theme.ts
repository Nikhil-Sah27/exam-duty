/**
 * Palette for the duty screens. Extends the slate/indigo scale the login and
 * placeholder screens already use, and keeps the web's teacher-facing status
 * colours: available is green, mine/selected is indigo, anything blocked is
 * red. Amber is reserved for advisory copy, never for a card state.
 */
export const colors = {
  screen: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  heading: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  primary: "#4f46e5",
  primarySoft: "#eef2ff",
  primaryText: "#3730a3",
  success: "#047857",
  successSoft: "#ecfdf5",
  successBorder: "#a7f3d0",
  danger: "#b91c1c",
  dangerSoft: "#fef2f2",
  dangerBorder: "#fecaca",
  notice: "#b45309",
  noticeSoft: "#fffbeb",
  noticeBorder: "#fde68a",
  chip: "#f1f5f9",
  chipText: "#475569",
  inverse: "#ffffff",
} as const;

export type Tone = "neutral" | "primary" | "success" | "danger" | "notice";

export const toneStyles: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: colors.chip, fg: colors.chipText, border: colors.border },
  primary: { bg: colors.primarySoft, fg: colors.primaryText, border: "#c7d2fe" },
  success: { bg: colors.successSoft, fg: colors.success, border: colors.successBorder },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerBorder },
  notice: { bg: colors.noticeSoft, fg: colors.notice, border: colors.noticeBorder },
};
