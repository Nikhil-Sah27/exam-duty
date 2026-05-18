import { useMemo } from "react";
import type { AvailableDutySlot } from "@/modules/shared/exams/selectors/examSelectors";
import { groupRoomsIntoRSGroups } from "../utils/rsDutyGroupingUtils";
import type { RSDutyGroup, RSDutyFilters } from "../types";

/**
 * Pure, memoised grouping. Takes the (already role-agnostic) list of
 * available duty slots and chunks them by 5 inside same
 * exam+date+time+block. Filters are applied **after** grouping so the
 * 5-per-block layout stays stable; filtering before would shuffle which
 * rooms land in which group as the user types.
 */
export function useRSDutyGrouping(
  slots: AvailableDutySlot[],
  filters: RSDutyFilters,
  chunkSize = 5,
): { groups: RSDutyGroup[]; filteredGroups: RSDutyGroup[] } {
  const groups = useMemo(
    () => groupRoomsIntoRSGroups(slots, chunkSize),
    [slots, chunkSize],
  );

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (filters.date) {
        const gd = new Date(g.date);
        const fd = new Date(filters.date);
        gd.setHours(0, 0, 0, 0);
        fd.setHours(0, 0, 0, 0);
        if (gd.getTime() !== fd.getTime()) return false;
      }
      if (filters.examType && g.examType !== filters.examType) return false;
      if (filters.semester && String(g.semester) !== filters.semester) return false;
      if (filters.department) {
        const want = filters.department.toUpperCase();
        if (!g.departments.includes(want)) return false;
      }
      return true;
    });
  }, [groups, filters]);

  return { groups, filteredGroups };
}
