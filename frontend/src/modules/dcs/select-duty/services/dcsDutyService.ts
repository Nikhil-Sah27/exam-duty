import api from "@/shared/lib/api";
import type { DcsGroup, DcsRoomContactsResponse } from "../types";

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Read all DCS groups visible to the current user. The backend filters by
 * `status` query string when supplied — e.g. `status=open` to drop the
 * already-claimed ones. We keep them by default so the UI can render
 * "Occupied by …" cards and explain why they aren't selectable.
 */
export const listDcsGroups = async (params?: {
  examGroup?: string;
  schedule?: string;
  status?: "open" | "claimed" | "released";
}): Promise<DcsGroup[]> => {
  const res = await api.get<ListResponse<DcsGroup>>("/dcs/groups", { params });
  return res.data.data;
};

export const getMyDcsGroups = async (): Promise<DcsGroup[]> => {
  const res = await api.get<ListResponse<DcsGroup>>("/dcs/groups/mine");
  return res.data.data;
};

export const claimDcsGroup = async (id: string): Promise<DcsGroup> => {
  const res = await api.post<SingleResponse<DcsGroup>>(`/dcs/groups/${id}/claim`);
  return res.data.data;
};

export const releaseDcsGroup = async (
  id: string,
  reason?: string,
): Promise<DcsGroup> => {
  const res = await api.post<SingleResponse<DcsGroup>>(
    `/dcs/groups/${id}/release`,
    { reason },
  );
  return res.data.data;
};

export const getDcsGroupContacts = async (
  id: string,
): Promise<DcsRoomContactsResponse> => {
  const res = await api.get<SingleResponse<DcsRoomContactsResponse>>(
    `/dcs/groups/${id}/invigilators`,
  );
  return res.data.data;
};
