// Barrel for the design-system tokens. Consumers can `import { gradients,
// shadows, chipVariants } from "@/shared/theme"` rather than reaching into
// individual files.

export { gradients, type GradientVariant } from "./gradients";
export { shadows } from "./shadows";
export {
  statusColors,
  examTypeColors,
  type StatusKey,
  type ExamTypeKey,
} from "./colors";
export { cardBase, innerPanel } from "./cardVariants";
export {
  chipVariants,
  buttonVariants,
  type ChipVariant,
  type ButtonVariant,
} from "./componentTokens";
