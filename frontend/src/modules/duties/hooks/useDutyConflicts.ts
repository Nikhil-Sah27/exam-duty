import { useCallback, useMemo } from "react";
import type { Duty } from "../types";
import {
  dutyConflictService,
  type ConflictAnalysis,
  type ConflictWindow,
} from "../services/dutyConflictService";

/**
 * Reusable conflict layer for every Select Duty hook
 * (`useDutySelection`, `useRSDutyAvailability`, `useDcsDutySelection`). Encapsulates the
 * `selected[] + myDuties[]` → "is this candidate blocked?" computation so:
 *
 *  - each role uses **the same** conflict definition (single source of truth)
 *  - hidden-count + banner copy come from one helper, not duplicated per page
 *  - card components receive a precomputed `ConflictAnalysis` and never run
 *    the engine inline
 */
export interface UseDutyConflictsArgs {
  selected: readonly ConflictWindow[];
  myDuties: readonly Duty[];
}

export interface UseDutyConflictsResult {
  /** Predicate — fastest path, no string allocation. */
  isConflict: (candidate: ConflictWindow) => boolean;
  /** Full analysis — used when a card needs reason/tooltip. */
  analyze: (candidate: ConflictWindow) => ConflictAnalysis;
  /**
   * Count and copy for the top banner. `hiddenCount` is the number of
   * candidates in `pool` that would be hidden/disabled because they
   * conflict; `banner` is the friendly message to surface above the grid.
   */
  summarize: (pool: readonly ConflictWindow[]) => {
    hiddenCount: number;
    banner: string | null;
  };
}

const FRIENDLY_BANNER = (count: number): string =>
  count === 1
    ? "1 duty is hidden because it overlaps with your current selection."
    : `${count} duties are hidden because they overlap with your current selection.`;

export function useDutyConflicts({
  selected,
  myDuties,
}: UseDutyConflictsArgs): UseDutyConflictsResult {
  // Stable blockers reference so analyze/isConflict closures don't churn.
  const blockers = useMemo(
    () => ({ selected, myDuties }),
    [selected, myDuties],
  );

  const isConflict = useCallback(
    (candidate: ConflictWindow) =>
      dutyConflictService.isTimeConflict(candidate, blockers),
    [blockers],
  );

  const analyze = useCallback(
    (candidate: ConflictWindow) =>
      dutyConflictService.analyze(candidate, blockers),
    [blockers],
  );

  const summarize = useCallback(
    (pool: readonly ConflictWindow[]) => {
      let hiddenCount = 0;
      for (const c of pool) {
        if (dutyConflictService.isTimeConflict(c, blockers)) hiddenCount += 1;
      }
      return {
        hiddenCount,
        banner: hiddenCount > 0 ? FRIENDLY_BANNER(hiddenCount) : null,
      };
    },
    [blockers],
  );

  return { isConflict, analyze, summarize };
}
