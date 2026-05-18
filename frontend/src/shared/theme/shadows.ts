// Shadow class strings used by the design system. We use Tailwind's arbitrary
// rgba shadows where the default tiers don't read warm enough. Coloured
// shadows (rose / blue / etc.) are applied by individual variants.

export const shadows = {
  /** Subtle resting elevation for non-interactive surfaces (stat tiles). */
  rest: "shadow-sm",
  /** Default card resting shadow — visible without being heavy. */
  card: "shadow-[0_4px_16px_rgba(15,23,42,0.06)]",
  /** Hover lift used by GradientCard and migrated cards. */
  hover: "hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)]",
  /** Stronger lift for "premium" surfaces like SEE / featured items. */
  premium: "shadow-[0_8px_24px_rgba(225,29,72,0.10)]",
  premiumHover: "hover:shadow-[0_18px_40px_rgba(225,29,72,0.18)]",
};
