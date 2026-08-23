import api from "@/shared/lib/api";
import type { TeacherDuty } from "@/modules/manage-duties/types";

/**
 * CS admin-assigns one RS **room group** to a specific teacher. The backend
 * creates N Duty rows (one per room) in a single transaction and fires one
 * `duty_assigned` notification per room.
 *
 * Payload mirrors the self-assign-group shape but adds the target `teacher`
 * and an explicit `role` (needed when the teacher holds more than one role).
 */

export interface AdminAssignRSGroupInput {
  teacher: string;
  examScheduleId: string;
  examRoomIds: string[];
  role: "rs" | "dcs";
}

export interface AdminAssignRSGroupResult {
  duties: TeacherDuty[];
}

export const adminAssignRSDutyGroup = async (
  input: AdminAssignRSGroupInput,
): Promise<AdminAssignRSGroupResult> => {
  const res = await api.post<{ success: boolean; data: TeacherDuty[] }>(
    "/duties/admin-assign-group",
    {
      teacher: input.teacher,
      examSchedule: input.examScheduleId,
      examRooms: input.examRoomIds,
      role: input.role,
    },
  );
  return { duties: res.data.data };
};
