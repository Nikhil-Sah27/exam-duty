import api from "@/shared/lib/api";
import { Teacher, TeacherDuty } from "../types";

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export const getTeachers = async (): Promise<Teacher[]> => {
  const res = await api.get<ListResponse<Teacher>>("/users");
  return res.data.data;
};

export const getTeacherById = async (id: string): Promise<Teacher> => {
  const res = await api.get<SingleResponse<Teacher>>(`/users/${id}`);
  return res.data.data;
};

export const getTeacherDuties = async (teacherId: string): Promise<TeacherDuty[]> => {
  const res = await api.get<ListResponse<TeacherDuty>>("/duties", {
    params: { teacher: teacherId },
  });
  return res.data.data;
};

/**
 * Assign-duty shape used by the visual CS workflow: pick a real
 * ExamSchedule + ExamRoom pair instead of manually typed room/date/time
 * strings. Backend service resolves room/date/times from the refs.
 */
export interface AssignByScheduleSlotPayload {
  examSchedule: string;
  examRoom: string;
  teacher: string;
}

export const assignDutyBySlot = async (
  data: AssignByScheduleSlotPayload
): Promise<TeacherDuty> => {
  const res = await api.post<SingleResponse<TeacherDuty>>(
    "/duties/admin-assign",
    data
  );
  return res.data.data;
};
