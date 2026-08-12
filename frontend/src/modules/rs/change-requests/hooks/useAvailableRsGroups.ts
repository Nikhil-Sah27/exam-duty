import { useMemo } from "react";
import { useAvailableDutySlots } from "@/modules/shared/exams/hooks/useSharedExamData";
import { groupRoomsIntoRSGroups } from "@/modules/rs/select-duty/utils/rsDutyGroupingUtils";
import type { RSDutyGroup } from "@/modules/rs/select-duty/types";

/**
 * All RS groups derivable from currently-active exam groups. Same pipeline the
 * RS Select Duty page consumes — the change-request target picker reuses it
 * verbatim so what's available here is exactly what would be available there,
 * including per-room `flags.rsAssigned` occupancy.
 */
export function useAvailableRsGroups() {
  const { data: slots, isLoading, error } = useAvailableDutySlots();
  const groups = useMemo<RSDutyGroup[]>(
    () => groupRoomsIntoRSGroups(slots ?? []),
    [slots],
  );
  return { groups, isLoading, error };
}
