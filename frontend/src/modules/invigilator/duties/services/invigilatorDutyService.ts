import api from "@/shared/lib/api";
import type {
  SelfAssignRequest,
  Duty,
  DutyListResponse,
} from "@/modules/duties/types";

/**
 * Single source of truth for invigilator-side duty mutations and per-user
 * duty lookups. Page-level orchestration (Select Duty page batch flow) and
 * modal-level interaction (Invigilator Exams room modal) both consume this.
 *
 * The selectDuty payload targets the ExamGroup → ExamSchedule → ExamRoom
 * domain. The backend resolves the room/date/time from those two IDs, so the
 * caller only needs to know which schedule + examRoom they're picking.
 */

export interface DutySelectionInput {
  /** ExamSchedule._id */
  examScheduleId: string;
  /** ExamRoom._id (the room-assignment record, not the bare Room) */
  examRoomId: string;
}

export const selectDuty = async (input: DutySelectionInput): Promise<Duty> => {
  const payload: SelfAssignRequest = {
    examSchedule: input.examScheduleId,
    examRoom: input.examRoomId,
  };
  const res = await api.post<{ success: boolean; data: Duty }>(
    "/duties/self-assign",
    payload
  );
  return res.data.data;
};

export const cancelDutySelection = async (
  dutyId: string,
  reason?: string
): Promise<Duty> => {
  const res = await api.patch<{ success: boolean; data: Duty }>(
    `/duties/${dutyId}/cancel`,
    { reason }
  );
  return res.data.data;
};

export const getMyDutySelections = async (
  teacherId: string
): Promise<Duty[]> => {
  const res = await api.get<DutyListResponse>("/duties", {
    params: { teacher: teacherId },
  });
  return res.data.data;
};
