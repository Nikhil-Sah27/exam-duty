import api from "@/shared/lib/api";
import {
  ChangeRequest,
  ChangeRequestListResponse,
  ChangeRequestResponse,
  CreateChangeRequestPayload,
} from "../types";

export const fetchChangeRequests = async (): Promise<ChangeRequest[]> => {
  const res = await api.get<ChangeRequestListResponse>("/change-requests");
  return res.data.data;
};

export const fetchMyChangeRequests = async (): Promise<ChangeRequest[]> => {
  const res = await api.get<ChangeRequestListResponse>("/change-requests/mine");
  return res.data.data;
};

export const createChangeRequest = async (
  data: CreateChangeRequestPayload
): Promise<ChangeRequest> => {
  const res = await api.post<ChangeRequestResponse>("/change-requests", data);
  return res.data.data;
};

export const approveChangeRequest = async (
  id: string,
  note?: string
): Promise<ChangeRequest> => {
  const res = await api.patch<ChangeRequestResponse>(
    `/change-requests/${id}/approve`,
    { note }
  );
  return res.data.data;
};

export const rejectChangeRequest = async (
  id: string,
  note?: string
): Promise<ChangeRequest> => {
  const res = await api.patch<ChangeRequestResponse>(
    `/change-requests/${id}/reject`,
    { note }
  );
  return res.data.data;
};
