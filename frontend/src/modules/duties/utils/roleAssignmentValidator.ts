import type { RoomDutyFlags } from "@/modules/shared/exams/types/exam.types";
import type { UserRole } from "@/shared/lib/types";

/**
 * Per-room role-slot eligibility. Each room exposes three independent slots:
 *
 *   - DCS         (Deputy Chief Superintendent)
 *   - RS          (Room Superintendent)
 *   - Invigilator
 *
 * One slot being filled does NOT block another — a room with a DCS still
 * needs an invigilator. The functions here centralise the "what does this
 * role flag actually map to?" decision so every dashboard reads from one
 * source of truth (no per-component inline switches).
 */

/** Roles that own a per-room slot. Excludes "cs" (Controller — admin only). */
export type SlotRole = "dcs" | "rs" | "invigilator";

/** True if the given role's slot already has an assignment on this room. */
export function hasAssignmentForRole(
  flags: RoomDutyFlags | undefined,
  role: SlotRole,
): boolean {
  if (!flags) return false;
  switch (role) {
    case "dcs":
      return !!flags.dcsAssigned;
    case "rs":
      return !!flags.rsAssigned;
    case "invigilator":
      return !!flags.invigilatorAssigned;
    default:
      return false;
  }
}

/** True if the given role can still claim this room (their slot is open). */
export function isRoleSlotAvailable(
  flags: RoomDutyFlags | undefined,
  role: SlotRole,
): boolean {
  return !hasAssignmentForRole(flags, role);
}

/**
 * Snapshot a room's per-role availability + the caller's eligibility for it.
 * Returns a structured view rather than a single boolean so consumers can
 * render badges ("DCS assigned", "RS vacant", …) and the selection state
 * from one read.
 */
export interface DutyAvailability {
  dcs: { assigned: boolean };
  rs: { assigned: boolean };
  invigilator: { assigned: boolean };
  /** Eligibility for the role passed to `getDutyAvailability`. */
  forRole: SlotRole | null;
  forRoleAssigned: boolean;
  forRoleSelectable: boolean;
}

export function getDutyAvailability(
  flags: RoomDutyFlags | undefined,
  role: UserRole | null | undefined,
): DutyAvailability {
  const slotRole: SlotRole | null = isSlotRole(role) ? role : null;
  const dcsAssigned = hasAssignmentForRole(flags, "dcs");
  const rsAssigned = hasAssignmentForRole(flags, "rs");
  const invAssigned = hasAssignmentForRole(flags, "invigilator");

  const forRoleAssigned = slotRole
    ? hasAssignmentForRole(flags, slotRole)
    : false;

  return {
    dcs: { assigned: dcsAssigned },
    rs: { assigned: rsAssigned },
    invigilator: { assigned: invAssigned },
    forRole: slotRole,
    forRoleAssigned,
    forRoleSelectable: slotRole ? !forRoleAssigned : false,
  };
}

function isSlotRole(role: string | null | undefined): role is SlotRole {
  return role === "dcs" || role === "rs" || role === "invigilator";
}
