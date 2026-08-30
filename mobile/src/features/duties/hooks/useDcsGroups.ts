import { useQuery } from "@tanstack/react-query";
import { getMyDcsGroups, listDcsGroups } from "../api";

/**
 * DCS groups are persisted server-side (DCSGroup collection), so unlike RS
 * there is nothing to derive — these two queries are the whole data layer.
 * Keys match frontend/src/modules/dcs/select-duty/hooks/useDcsGroups.ts and
 * .../upcoming-duties/hooks/useDcsUpcomingDuties.ts.
 */

export function useDcsGroups() {
  return useQuery({
    queryKey: ["dcs", "groups"],
    queryFn: listDcsGroups,
    staleTime: 30_000,
  });
}

export function useMyDcsGroups() {
  return useQuery({
    queryKey: ["dcs", "my-groups"],
    queryFn: getMyDcsGroups,
    staleTime: 30_000,
  });
}
