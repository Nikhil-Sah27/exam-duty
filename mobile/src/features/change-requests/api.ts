import api from "@/api/client";
import type { DcsGroup, ListResponse, SingleResponse } from "@/shared/types";
import type {
  ChangeRequest,
  CreateChangeRequestPayload,
  ReplacementSlot,
  SwapCandidate,
} from "./types";

/**
 * Every endpoint the Change Requests screen touches. Ported from:
 *   • frontend/src/modules/shared/change-requests/services/changeRequestService.ts
 *   • frontend/src/modules/change-requests/services/dcsChangeRequestService.ts
 *
 * Approve and reject are deliberately absent: both routes are behind
 * `requireRole("cs")` on the backend and CS has no mobile surface at all.
 */

/** All three request kinds go through one endpoint; `type` picks the fork. */
export const createChangeRequest = async (
  payload: CreateChangeRequestPayload
): Promise<ChangeRequest> => {
  const res = await api.post<SingleResponse<ChangeRequest>>(
    "/change-requests",
    payload
  );
  return res.data.data;
};

export const getMyChangeRequests = async (): Promise<ChangeRequest[]> => {
  const res = await api.get<ListResponse<ChangeRequest>>(
    "/change-requests/mine"
  );
  return res.data.data;
};

/** Vacant invigilator slots this duty could be moved to. */
export const getReplacementSlots = async (
  dutyId: string
): Promise<ReplacementSlot[]> => {
  const res = await api.get<ListResponse<ReplacementSlot>>(
    `/change-requests/replacements/${dutyId}`
  );
  return res.data.data;
};

/**
 * Candidates for a `swap` request. Scoped to `role=invigilator` because a swap
 * hands over an invigilator duty — the backend only checks that the target
 * exists and is active, so the narrowing is ours to make and keeps the picker
 * to a list a phone can actually scroll.
 */
export const getSwapCandidates = async (): Promise<SwapCandidate[]> => {
  const res = await api.get<ListResponse<SwapCandidate>>("/users", {
    params: { role: "invigilator", isActive: "true" },
  });
  return res.data.data;
};

/** Open DCS groups — the target pool for a `dcs_swap`. */
export const getOpenDcsGroups = async (): Promise<DcsGroup[]> => {
  const res = await api.get<ListResponse<DcsGroup>>("/dcs/groups", {
    params: { status: "open" },
  });
  return res.data.data;
};
