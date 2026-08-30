import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyDcsGroups } from "@/features/duties/api";
import {
  createChangeRequest,
  getMyChangeRequests,
  getOpenDcsGroups,
  getReplacementSlots,
  getSwapCandidates,
} from "./api";
import type { CreateChangeRequestPayload } from "./types";

/**
 * Mobile port of the web's change-request hooks. Keep in sync with:
 *   • frontend/src/modules/shared/change-requests/hooks/useChangeRequests.ts
 *   • frontend/src/modules/change-requests/hooks/useDcsChangeRequests.ts
 *
 * Query keys match the web's so a screen reading the same data on either
 * client invalidates the same entries.
 */
export const REQUEST_KEYS = {
  mine: ["change-requests", "mine"] as const,
  replacements: (dutyId: string) =>
    ["change-requests", "replacements", dutyId] as const,
  swapCandidates: ["change-requests", "swap-candidates"] as const,
  myDcsGroups: ["dcs", "my-groups"] as const,
  openDcsGroups: ["dcs", "groups", "open"] as const,
};

export function useMyChangeRequests() {
  return useQuery({ queryKey: REQUEST_KEYS.mine, queryFn: getMyChangeRequests });
}

export function useReplacementSlots(dutyId: string | null) {
  return useQuery({
    queryKey: REQUEST_KEYS.replacements(dutyId as string),
    queryFn: () => getReplacementSlots(dutyId as string),
    enabled: Boolean(dutyId),
  });
}

export function useSwapCandidates(enabled: boolean) {
  return useQuery({
    queryKey: REQUEST_KEYS.swapCandidates,
    queryFn: getSwapCandidates,
    enabled,
  });
}

export function useMyDcsGroups() {
  return useQuery({
    queryKey: REQUEST_KEYS.myDcsGroups,
    queryFn: getMyDcsGroups,
    staleTime: 30_000,
  });
}

export function useOpenDcsGroups(enabled: boolean) {
  return useQuery({
    queryKey: REQUEST_KEYS.openDcsGroups,
    queryFn: getOpenDcsGroups,
    enabled,
    staleTime: 30_000,
  });
}

/**
 * A submitted request does not move any duty yet, but it does change what the
 * other screens may offer (one pending request per duty / per group), so the
 * duty and group caches are refreshed alongside the request list.
 */
export function useCreateChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChangeRequestPayload) =>
      createChangeRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["change-requests"] });
      qc.invalidateQueries({ queryKey: ["shared", "duty-status"] });
      qc.invalidateQueries({ queryKey: ["shared", "duties-by-teacher"] });
      qc.invalidateQueries({ queryKey: ["dcs"] });
    },
  });
}
