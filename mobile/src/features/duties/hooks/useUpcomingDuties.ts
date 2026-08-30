import { useMemo } from "react";
import type { DcsGroup, Duty } from "@/shared/types";
import { useAuthStore } from "@/shared/store/auth.store";
import { buildDutySections, countDates, type DutySection } from "../utils/sections";
import {
  filterUpcomingRsDuties,
  groupRSDutiesIntoUpcomingGroups,
  type RSUpcomingGroup,
} from "../utils/rsGrouping";
import { filterUpcomingDuties } from "../utils/upcoming";
import { useMyDcsGroups } from "./useDcsGroups";
import { useDutiesByTeacher } from "./useExamData";

/**
 * The three Upcoming Duties readers. Ported from
 *   frontend/src/modules/invigilator/upcoming-duties/hooks/useUpcomingDuties.ts
 *   frontend/src/modules/rs/upcoming-duties/hooks/useRSUpcomingGroups.ts
 *   frontend/src/modules/dcs/upcoming-duties/hooks/useDcsUpcomingDuties.ts
 *
 * Invigilator and RS both read `/duties?teacher=:id` — RS then folds those
 * per-room rows back into the groups they were claimed as, so an RS holding
 * five rooms sees ONE card, not five. That fold runs on RS-role duties only:
 * the endpoint returns every role's duties and a teacher can hold more than
 * one, and a stray invigilator room in the same schedule + building would
 * shift the chunk boundaries the group id is derived from. DCS reads its
 * persisted groups directly.
 */
export interface UpcomingResult<T> {
  sections: DutySection<T>[];
  /** Cards across every section. */
  itemCount: number;
  /** Distinct days covered. */
  dayCount: number;
  isLoading: boolean;
  error: Error | null;
}

export function useInvigilatorUpcomingDuties(): UpcomingResult<Duty> {
  const userId = useAuthStore((s) => s.user?.id);
  const query = useDutiesByTeacher(userId);

  const duties = useMemo(
    () => filterUpcomingDuties(query.data ?? []),
    [query.data]
  );

  const sections = useMemo(
    () =>
      buildDutySections(duties, (d) => ({
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
      })),
    [duties]
  );

  return {
    sections,
    itemCount: duties.length,
    dayCount: countDates(sections),
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}

export interface RsUpcomingResult extends UpcomingResult<RSUpcomingGroup> {
  /** Rooms across every group — the number an RS actually walks. */
  roomCount: number;
}

export function useRsUpcomingGroups(): RsUpcomingResult {
  const userId = useAuthStore((s) => s.user?.id);
  const query = useDutiesByTeacher(userId);

  const groups = useMemo(
    () =>
      groupRSDutiesIntoUpcomingGroups(filterUpcomingRsDuties(query.data ?? [])),
    [query.data]
  );

  const sections = useMemo(
    () =>
      buildDutySections(groups, (g) => ({
        date: g.date,
        startTime: g.startTime,
        endTime: g.endTime,
      })),
    [groups]
  );

  return {
    sections,
    itemCount: groups.length,
    roomCount: groups.reduce((sum, g) => sum + g.rooms.length, 0),
    dayCount: countDates(sections),
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}

export function useDcsUpcomingGroups(): UpcomingResult<DcsGroup> {
  const query = useMyDcsGroups();

  const groups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (query.data ?? [])
      .filter((g) => g.status === "claimed")
      .filter((g) => {
        const day = new Date(g.schedule.date);
        day.setHours(0, 0, 0, 0);
        return day >= today;
      });
  }, [query.data]);

  const sections = useMemo(
    () =>
      buildDutySections(groups, (g) => ({
        date: g.schedule.date,
        startTime: g.schedule.startTime,
        endTime: g.schedule.endTime,
      })),
    [groups]
  );

  return {
    sections,
    itemCount: groups.length,
    dayCount: countDates(sections),
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
