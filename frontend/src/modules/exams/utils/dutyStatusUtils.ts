import type { RoomDutyFlags, DutyStatus } from "../types";

/**
 * Derive duty status from assignment flags.
 * Always computed, never stored in state.
 */
export function getDutyStatus(flags: RoomDutyFlags | undefined): DutyStatus {
  if (!flags) return "NOT_ASSIGNED";

  const { dcsAssigned, rsAssigned, invigilatorAssigned } = flags;

  if (!dcsAssigned && !rsAssigned && !invigilatorAssigned) {
    return "NOT_ASSIGNED";
  }

  if (dcsAssigned && rsAssigned && invigilatorAssigned) {
    return "FULLY_ASSIGNED";
  }

  return "PARTIAL";
}

/** Map duty status to Tailwind color classes */
export function getStatusColors(status: DutyStatus): {
  border: string;
  bg: string;
  dot: string;
} {
  switch (status) {
    case "FULLY_ASSIGNED":
      return {
        border: "border-green-300",
        bg: "bg-green-50 hover:bg-green-100",
        dot: "bg-green-500",
      };
    case "PARTIAL":
      return {
        border: "border-amber-300",
        bg: "bg-amber-50 hover:bg-amber-100",
        dot: "bg-amber-500",
      };
    case "NOT_ASSIGNED":
    default:
      return {
        border: "border-red-300",
        bg: "bg-red-50 hover:bg-red-100",
        dot: "bg-red-500",
      };
  }
}

/** Human-readable label for duty status */
export function getStatusLabel(status: DutyStatus): string {
  switch (status) {
    case "FULLY_ASSIGNED":
      return "Fully Assigned";
    case "PARTIAL":
      return "Partially Assigned";
    case "NOT_ASSIGNED":
    default:
      return "Not Assigned";
  }
}
