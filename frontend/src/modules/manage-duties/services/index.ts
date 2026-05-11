import api from "@/shared/lib/api";
import { Teacher, TeacherDuty, AssignDutyPayload } from "../types";

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

export const assignDuty = async (data: AssignDutyPayload): Promise<TeacherDuty> => {
  const res = await api.post<SingleResponse<TeacherDuty>>("/duties/admin-assign", data);
  return res.data.data;
};
