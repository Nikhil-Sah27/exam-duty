import api from "@/shared/lib/api";
import type { Duty } from "@/modules/duties/types";

/**
 * RS self-assigns one **group** of rooms at a time. The backend creates N
 * Duty rows (one per room in the group) inside a single transaction —
 * either all rooms get assigned to this RS, or none do (and the conflict is
 * reported back to the caller).
 *
 * Falls back to per-room sequential creation when the deployment is a
 * standalone Mongo; conflict handling on the partial-state case is the
 * backend's responsibility (see withOptionalTransaction).
 */

export interface RSGroupSelectionInput {
  /** ExamSchedule._id all rooms in this group share. */
  examScheduleId: string;
  /** ExamRoom._ids (the room-assignment records) for every room in the group. */
  examRoomIds: string[];
}

export interface RSGroupSelectionResult {
  /** The N Duty docs created for this group, populated. */
  duties: Duty[];
}

export const selectRSDutyGroup = async (
  input: RSGroupSelectionInput,
): Promise<RSGroupSelectionResult> => {
  const res = await api.post<{ success: boolean; data: Duty[] }>(
    "/duties/self-assign-group",
    {
      examSchedule: input.examScheduleId,
      examRooms: input.examRoomIds,
    },
  );
  return { duties: res.data.data };
};
