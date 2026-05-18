// Composable class-name maps for cards. Components compose `rest` + optional
// `hover` + the chosen variant's `gradients.bg` + the shared `shadows.card`.
// Keeping the maps small + explicit keeps the design system inspectable.

export const cardBase = {
  rest: "relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 transition-all duration-200",
  // Animation tier used by interactive cards (link + button cards). Matches
  // the spec: translateY(-4px) + small scale + soft shadow growth.
  hover:
    "hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)]",
  // Active / selected state (e.g. semester tile picked in DepartmentDetails).
  active: "border-blue-500 ring-2 ring-blue-200",
};

/** Inner panel used for stat rows / divider sections inside a card. */
export const innerPanel = {
  divider: "border-t border-gray-100 pt-4 mt-4",
  subtle: "bg-white/60 backdrop-blur-sm",
};
