import api from "@/shared/lib/api";
import {
  SelfAssignRequest,
  AdminAssignRequest,
  DutyListResponse,
  DutyResponse,
  Duty,
} from "../types";

export const fetchDuties = async (): Promise<Duty[]> => {
  const res = await api.get<DutyListResponse>("/duties");
  return res.data.data;
};

export const fetchDutyById = async (id: string): Promise<Duty> => {
  const res = await api.get<DutyResponse>(`/duties/${id}`);
  return res.data.data;
};

export const selfAssignDuty = async (data: SelfAssignRequest): Promise<Duty> => {
  const res = await api.post<DutyResponse>("/duties/self-assign", data);
  return res.data.data;
};

export const adminAssignDuty = async (data: AdminAssignRequest): Promise<Duty> => {
  const res = await api.post<DutyResponse>("/duties/admin-assign", data);
  return res.data.data;
};

export const cancelDuty = async (id: string, reason?: string): Promise<Duty> => {
  const res = await api.patch<DutyResponse>(`/duties/${id}/cancel`, { reason });
  return res.data.data;
};
