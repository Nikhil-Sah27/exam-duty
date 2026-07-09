import type { AssigneePublic, RoomDutyFlags } from "@/modules/exams/types";
import {
  getRoleAssignee,
  getRoleAssignmentStatus,
  type OperationalRoleKey,
} from "./assignmentStatusUtils";

/**
 * Role-isolation primitives. Every per-role decision a teacher modal needs
 * goes through here, so the answer is computed in one place — and so we can
 * never accidentally treat another role's occupancy as the viewer's
 * conflict or block.
 *
 * Backing assignment data still comes from `assignmentStatusUtils`; this
 * file's job is the *isolation* layer on top: take the raw "is this role
 * filled?" + "by whom?" data and convert it into a viewer-relative display
 * state that respects "I only care about my own role".
 */

/** True iff the given role is the viewer's own role. */
export function isMyRole(
  role: OperationalRoleKey,
  viewerRole: OperationalRoleKey | null | undefined,
): boolean {
  return Boolean(viewerRole) && role === viewerRole;
}

/** True iff the role slot on the room currently has a teacher. */
export function isRoleAssigned(
  flags: RoomDutyFlags | undefined,
  role: OperationalRoleKey,
): boolean {
  if (!flags) return false;
  const key = roleToFlagKey(role);
  return Boolean(flags[key]);
}

/**
 * Conflict applies ONLY to the viewer's own role. Another role being
 * filled or having a time clash with the viewer's commitments never raises
 * a conflict for the row representing that other role.
 */
export function isRoleConflict(
  role: OperationalRoleKey,
  viewerRole: OperationalRoleKey | null | undefined,
  hasViewerConflict: boolean,
): boolean {
  return isMyRole(role, viewerRole) && hasViewerConflict;
}

/**
 * Five-state enum the cards / badges branch on. Designed so each value
 * implies its own colour family — no consumer needs to inspect role +
 * isMine + assigned separately to pick a paint.
 *
 *  OWNED         — viewer's role + viewer owns this row.       blue
 *  OPEN          — viewer's role + open, no conflict.           green
 *  BLOCKED       — viewer's role + time conflict on viewer.     red
 *  INFO_ASSIGNED — other role + occupied.                       neutral / gray
 *  INFO_VACANT   — other role + open.                           neutral / gray
 */
export type RoleDisplayState =
  | "OWNED"
  | "OPEN"
  | "BLOCKED"
  | "INFO_ASSIGNED"
  | "INFO_VACANT";

export interface RoleDisplayContext {
  role: OperationalRoleKey;
  viewerRole: OperationalRoleKey | null | undefined;
  flags: RoomDutyFlags | undefined;
  myUserId: string | null | undefined;
  /** Whether the viewer has a time-conflict on THEIR own role for this slot. */
  hasViewerConflict?: boolean;
  /** Force OWNED for the viewer's row even when the flag is still stale. */
  isMine?: boolean;
}

export function getRoleDisplayState(ctx: RoleDisplayContext): RoleDisplayState {
  const { role, viewerRole, flags, myUserId, hasViewerConflict, isMine } = ctx;
  const assigned = isRoleAssigned(flags, role);
  const assignee = getRoleAssignee(flags, role);
  const own = isMyRole(role, viewerRole);

  if (own) {
    // The viewer's row honours their actual ownership + conflict state.
    if (isMine) return "OWNED";
    if (
      assigned &&
      assignee &&
      myUserId &&
      String(assignee._id) === String(myUserId)
    ) {
      return "OWNED";
    }
    if (assigned) {
      // Their own role slot is held by someone else — still a real "occupied"
      // case for the viewer, so this surfaces as BLOCKED (red).
      return "BLOCKED";
    }
    if (hasViewerConflict) return "BLOCKED";
    return "OPEN";
  }

  // Other-role row: never red, never "conflict". Strictly informational.
  return assigned ? "INFO_ASSIGNED" : "INFO_VACANT";
}

/** Headline label for a row, decoupled from paint. */
export function getRoleDisplayLabel(state: RoleDisplayState): string {
  switch (state) {
    case "OWNED":
      return "My Duty";
    case "OPEN":
      return "Available";
    case "BLOCKED":
      return "Occupied";
    case "INFO_ASSIGNED":
      return "Assigned";
    case "INFO_VACANT":
      return "Vacant";
  }
}

/**
 * The colour family for a row. Other-role rows get a neutral gray
 * palette — green / blue / red are reserved for the viewer's own role so
 * the visual hierarchy matches "this is what affects me".
 */
export interface RoleDisplayPaint {
  border: string;
  bg: string;
  gradient: string;
  text: string;
  dot: string;
  /** Pill background used by RoleStatusBadge. */
  pill: string;
  /** Border tint when the row appears inside an unbordered grid. */
  ring: string;
}

const PAINT: Record<RoleDisplayState, RoleDisplayPaint> = {
  OWNED: {
    border: "border-blue-300",
    bg: "bg-blue-50",
    gradient: "bg-gradient-to-r from-blue-600 to-indigo-600",
    text: "text-blue-700",
    dot: "bg-blue-500",
    pill: "bg-gradient-to-r from-blue-600 to-indigo-600",
    ring: "ring-blue-100",
  },
  OPEN: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    gradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    pill: "bg-gradient-to-r from-emerald-500 to-teal-500",
    ring: "ring-emerald-100",
  },
  BLOCKED: {
    border: "border-red-300",
    bg: "bg-red-50",
    gradient: "bg-gradient-to-r from-red-500 to-rose-500",
    text: "text-red-700",
    dot: "bg-red-500",
    pill: "bg-gradient-to-r from-red-500 to-rose-500",
    ring: "ring-red-100",
  },
  INFO_ASSIGNED: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    gradient: "bg-gradient-to-r from-slate-500 to-slate-600",
    text: "text-gray-700",
    dot: "bg-gray-400",
    pill: "bg-gradient-to-r from-slate-500 to-slate-600",
    ring: "ring-gray-100",
  },
  INFO_VACANT: {
    border: "border-gray-200",
    bg: "bg-white",
    gradient: "bg-gradient-to-r from-gray-400 to-gray-500",
    text: "text-gray-500",
    dot: "bg-gray-300",
    pill: "bg-gradient-to-r from-gray-400 to-gray-500",
    ring: "ring-gray-100",
  },
};

export function getRoleDisplayPaint(state: RoleDisplayState): RoleDisplayPaint {
  return PAINT[state];
}

// ── Glue ────────────────────────────────────────────────────────────────

const FLAG_KEY_BY_ROLE: Record<
  OperationalRoleKey,
  "invigilatorAssigned" | "rsAssigned" | "dcsAssigned"
> = {
  invigilator: "invigilatorAssigned",
  rs: "rsAssigned",
  dcs: "dcsAssigned",
};

function roleToFlagKey(
  role: OperationalRoleKey,
): "invigilatorAssigned" | "rsAssigned" | "dcsAssigned" {
  return FLAG_KEY_BY_ROLE[role];
}

/** Re-export so consumers only need one import. */
export function getRoleTeacher(
  flags: RoomDutyFlags | undefined,
  role: OperationalRoleKey,
): AssigneePublic | null {
  return getRoleAssignee(flags, role);
}

/** Legacy adapter — old card states map onto the new display states. */
export function roleStatusFromAssignment(
  status: ReturnType<typeof getRoleAssignmentStatus>,
  viewerOwnsThisRole: boolean,
): RoleDisplayState {
  if (status === "MINE") return "OWNED";
  if (status === "ASSIGNED") {
    return viewerOwnsThisRole ? "BLOCKED" : "INFO_ASSIGNED";
  }
  return viewerOwnsThisRole ? "OPEN" : "INFO_VACANT";
}
