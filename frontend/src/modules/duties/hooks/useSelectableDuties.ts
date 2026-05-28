import { useMemo } from "react";
import {
  getSelectableDuties,
  selectableFilter,
  type DutyTemporalRef,
} from "../utils/dutyStatusFilter";

/**
 * Memoised hook around the shared `getSelectableDuties` primitive. Use the
 * direct form when your items already match `DutyTemporalRef`; use the
 * adapter form when the temporal fields are nested (DCS group, RS batch, …).
 *
 *   const slots = useSelectableDuties(rawSlots);
 *
 *   const groups = useSelectableDuties(rawGroups, (g) => ({
 *     date: g.schedule.date,
 *     startTime: g.schedule.startTime,
 *     endTime: g.schedule.endTime,
 *     cancelled: g.status === "released",
 *   }));
 */
export function useSelectableDuties<T extends DutyTemporalRef>(
  duties: readonly T[],
): T[];
export function useSelectableDuties<T>(
  duties: readonly T[],
  getTemporalRef: (item: T) => DutyTemporalRef,
): T[];
export function useSelectableDuties<T>(
  duties: readonly T[],
  getTemporalRef?: (item: T) => DutyTemporalRef,
): T[] {
  return useMemo(() => {
    if (!getTemporalRef) {
      return getSelectableDuties(duties as readonly DutyTemporalRef[]) as T[];
    }
    return selectableFilter(duties, getTemporalRef);
  }, [duties, getTemporalRef]);
}
