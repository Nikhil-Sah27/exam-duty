import api from "@/api/client";
import type {
  DcsGroup,
  Duty,
  DutyStatusMap,
  ExamGroup,
  ExamGroupDetails,
  ListResponse,
  SingleResponse,
} from "@/shared/types";

/**
 * Every endpoint the two duty screens touch, in one place. Ported from the
 * web's four service files — keep in sync with:
 *   • frontend/src/modules/shared/exams/services/examQueryService.ts
 *   • frontend/src/modules/invigilator/duties/services/invigilatorDutyService.ts
 *   • frontend/src/modules/rs/select-duty/services/rsDutyService.ts
 *   • frontend/src/modules/dcs/select-duty/services/dcsDutyService.ts
 */

/* ------------------------------------------------------------- exam data */

export const fetchExamGroups = async (): Promise<ExamGroup[]> => {
  const res = await api.get<ListResponse<ExamGroup>>("/exam-groups");
  return res.data.data;
};

export const fetchExamGroupDetails = async (
  id: string
): Promise<ExamGroupDetails> => {
  const res = await api.get<SingleResponse<ExamGroupDetails>>(
    `/exam-groups/${id}/details`
  );
  return res.data.data;
};

export const fetchExamDutyStatus = async (
  groupId: string
): Promise<DutyStatusMap> => {
  const res = await api.get<SingleResponse<DutyStatusMap>>(
    `/exam-groups/${groupId}/duty-status`
  );
  return res.data.data;
};

export const fetchDutiesByTeacher = async (
  teacherId: string
): Promise<Duty[]> => {
  const res = await api.get<ListResponse<Duty>>("/duties", {
    params: { teacher: teacherId },
  });
  return res.data.data;
};

/* ------------------------------------------------------------- claiming */

/** Invigilators claim ONE room. The backend resolves date/time/room from the
 *  two ids and stamps the duty with the caller's activeRole. */
export const selfAssignDuty = async (input: {
  examScheduleId: string;
  examRoomId: string;
}): Promise<Duty> => {
  const res = await api.post<SingleResponse<Duty>>("/duties/self-assign", {
    examSchedule: input.examScheduleId,
    examRoom: input.examRoomId,
  });
  return res.data.data;
};

/**
 * RS claims a whole GROUP — one call, N duties, all-or-nothing on the server
 * (see backend duty.service.selfAssignDutyGroup). Rejected outright for an
 * invigilator activeRole, which is why this never appears on their screen.
 */
export const selfAssignDutyGroup = async (input: {
  examScheduleId: string;
  examRoomIds: string[];
}): Promise<Duty[]> => {
  const res = await api.post<ListResponse<Duty>>("/duties/self-assign-group", {
    examSchedule: input.examScheduleId,
    examRooms: input.examRoomIds,
  });
  return res.data.data;
};

/* ----------------------------------------------------------- dcs groups */

export const listDcsGroups = async (): Promise<DcsGroup[]> => {
  const res = await api.get<ListResponse<DcsGroup>>("/dcs/groups");
  return res.data.data;
};

export const getMyDcsGroups = async (): Promise<DcsGroup[]> => {
  const res = await api.get<ListResponse<DcsGroup>>("/dcs/groups/mine");
  return res.data.data;
};

export const claimDcsGroup = async (id: string): Promise<DcsGroup> => {
  const res = await api.post<SingleResponse<DcsGroup>>(
    `/dcs/groups/${id}/claim`
  );
  return res.data.data;
};
