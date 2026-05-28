import { useQuery } from "@tanstack/react-query";
import { listDcsGroups } from "../services/dcsDutyService";

/**
 * Single source for "the visible DCS groups". Shared cache key so the
 * select-duty page, dashboard preview, and post-claim invalidations all
 * see consistent data.
 */
export function useDcsGroups() {
  return useQuery({
    queryKey: ["dcs", "groups"],
    queryFn: () => listDcsGroups(),
    staleTime: 30_000,
  });
}
