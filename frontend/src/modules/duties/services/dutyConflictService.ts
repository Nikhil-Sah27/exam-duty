import type { Duty } from "../types";
import {
  getConflictingDuties,
  getConflictReason,
  isTimeConflict,
  type ConflictItem,
  type ConflictWindow,
} from "../utils/dutyConflictUtils";

/**
 * Stateless service tier over `dutyConflictUtils`. Same primitives,
 * exposed as a service so hooks/components can depend on a single named
 * import that's easy to mock in tests and easy to swap if a future role
 * needs server-side conflict checking.
 *
 * Anything stateful (caching, react-query) belongs in
 * `useDutyConflicts` — this layer remains pure.
 */

export type { ConflictItem, ConflictWindow };

export interface ConflictAnalysis {
  /** True if at least one selected/persisted item overlaps the candidate. */
  conflict: boolean;
  /** Every overlapping item — selected windows first, then assigned duties. */
  conflicting: ConflictItem[];
  /** Tooltip / banner copy if a conflict exists, else null. */
  reason: string | null;
}

export interface ConflictBlockers {
  selected?: readonly ConflictWindow[];
  myDuties?: readonly Duty[];
}

export const dutyConflictService = {
  isTimeConflict,
  getConflictingDuties,
  getConflictReason,

  /**
   * Single-call answer for a card: "is this in conflict, and if so why?"
   * Cards consume the analysis directly so they don't run the conflict
   * engine three times during one render.
   */
  analyze(
    candidate: ConflictWindow,
    blockers: ConflictBlockers = {},
  ): ConflictAnalysis {
    const conflicting = getConflictingDuties(candidate, blockers);
    return {
      conflict: conflicting.length > 0,
      conflicting,
      reason: conflicting.length > 0 ? getConflictReason(candidate, blockers) : null,
    };
  },
};
