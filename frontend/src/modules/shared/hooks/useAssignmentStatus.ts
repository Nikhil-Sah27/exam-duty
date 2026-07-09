import { useMemo } from "react";
import { useAuthStore } from "@/shared/store/auth.store";
import type { RoomDutyFlags } from "@/modules/exams/types";
import {
  getRoleAssignee,
  getRoleAssignmentStatus,
  getTeacherAssignmentStatus,
  getTeacherStatusLabel,
  getTeacherStatusPaint,
  type AssignmentRoleStatus,
  type OperationalRoleKey,
  type TeacherAssignmentStatus,
} from "../utils/assignmentStatusUtils";

/**
 * Single reactive entry point for "what's the teacher-perspective state of
 * this room/slot, and how should it paint?". Backs every teacher-side card,
 * chip, modal row, and badge so the answer is computed once per render and
 * shared across the tree.
 *
 * Pass `viewerRole` explicitly when the caller knows which role this slot
 * belongs to (DCS, RS, Invigilator). When omitted the hook reads the
 * logged-in user's role from the auth store — fine for the common case where
 * the viewer is the role.
 */
export interface UseAssignmentStatusArgs {
  flags: RoomDutyFlags | undefined;
  viewerRole?: OperationalRoleKey;
  /** Whether THIS room's role is owned by the viewer (computed externally). */
  isMine?: boolean;
  /** Whether selecting this slot would clash with another duty the viewer holds. */
  hasConflict?: boolean;
}

export interface UseAssignmentStatusResult {
  status: TeacherAssignmentStatus;
  label: string;
  paint: ReturnType<typeof getTeacherStatusPaint>;
  /** Per-role rows used by the modal. */
  roles: Array<{
    role: OperationalRoleKey;
    status: AssignmentRoleStatus;
    teacher: ReturnType<typeof getRoleAssignee>;
  }>;
}

export function useAssignmentStatus({
  flags,
  viewerRole,
  isMine,
  hasConflict,
}: UseAssignmentStatusArgs): UseAssignmentStatusResult {
  const user = useAuthStore((s) => s.user);
  const myUserId = user?.id ?? null;
  const role = (viewerRole ??
    (user?.role as OperationalRoleKey | undefined) ??
    "invigilator") as OperationalRoleKey;

  return useMemo(() => {
    const roles: UseAssignmentStatusResult["roles"] = (
      ["dcs", "rs", "invigilator"] as OperationalRoleKey[]
    ).map((r) => ({
      role: r,
      // If the caller already knows "I own this exact slot" (e.g. via the
      // duty-by-teacher list because the room field stores the room number,
      // not the userId) honor it for the viewer's own role row.
      status:
        r === role && isMine
          ? "MINE"
          : getRoleAssignmentStatus(flags, r, myUserId),
      teacher: getRoleAssignee(flags, r),
    }));

    const status = getTeacherAssignmentStatus({
      flags,
      viewerRole: role,
      myUserId,
      hasConflict,
    });
    // Same override as above — `isMine` from the duties index takes
    // precedence over flag-derived MINE so the user-facing label matches
    // what they expect after a fresh selection lands.
    const finalStatus: TeacherAssignmentStatus = isMine ? "MINE" : status;

    return {
      status: finalStatus,
      label: getTeacherStatusLabel(finalStatus),
      paint: getTeacherStatusPaint(finalStatus),
      roles,
    };
  }, [flags, role, isMine, hasConflict, myUserId]);
}
