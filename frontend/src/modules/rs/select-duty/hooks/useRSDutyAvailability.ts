import { useCallback, useMemo } from "react";
import type { Duty } from "@/modules/duties/types";
import {
  useDutyConflicts,
  type UseDutyConflictsResult,
} from "@/modules/duties/hooks/useDutyConflicts";
import type { ConflictAnalysis } from "@/modules/duties/services/dutyConflictService";
import type { RSDutyGroup, RSGroupState, RSSelectionValidation } from "../types";

/**
 * Per-group state machine for RS Select Duty:
 *
 *   SELECTED  — group is in `selected[]`
 *   FULL      — every room in the group already has an RS assigned
 *   CONFLICT  — group's time overlaps with another selected group or a
 *               persisted assigned-duty on the same day
 *   AVAILABLE — none of the above
 *
 * Conflict detection delegates to the shared `useDutyConflicts` hook — same
 * primitive Invigilator + DCS use, so the three flows stay aligned.
 */
export interface UseRSDutyAvailabilityResult {
  stateOf: (group: RSDutyGroup) => RSGroupState;
  validate: (candidate: RSDutyGroup) => RSSelectionValidation;
  conflictFor: (group: RSDutyGroup) => ConflictAnalysis;
  summarize: UseDutyConflictsResult["summarize"];
}

export function useRSDutyAvailability(
  selected: RSDutyGroup[],
  myDuties: Duty[],
): UseRSDutyAvailabilityResult {
  const selectedWindows = useMemo(
    () =>
      selected.map((s) => ({
        id: s.groupId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        roomNumber: s.rangeLabel,
      })),
    [selected],
  );

  const { isConflict, analyze, summarize } = useDutyConflicts({
    selected: selectedWindows,
    myDuties,
  });

  const groupWindow = useCallback(
    (group: RSDutyGroup) => ({
      id: group.groupId,
      date: group.date,
      startTime: group.startTime,
      endTime: group.endTime,
      roomNumber: group.rangeLabel,
    }),
    [],
  );

  const stateOf = useCallback(
    (group: RSDutyGroup): RSGroupState => {
      if (selected.some((s) => s.groupId === group.groupId)) return "SELECTED";
      if (group.allAssigned) return "FULL";
      if (isConflict(groupWindow(group))) return "CONFLICT";
      return "AVAILABLE";
    },
    [selected, isConflict, groupWindow],
  );

  const validate = useCallback(
    (candidate: RSDutyGroup): RSSelectionValidation => {
      if (candidate.allAssigned) {
        return {
          ok: false,
          reason: "Every room in this group already has an RS assigned.",
        };
      }
      if (selected.some((s) => s.groupId === candidate.groupId)) {
        return { ok: false, reason: "This group is already in your selection." };
      }
      const analysis = analyze(groupWindow(candidate));
      if (analysis.conflict) {
        return {
          ok: false,
          reason: analysis.reason || "This time conflicts with another duty.",
        };
      }
      return { ok: true };
    },
    [selected, analyze, groupWindow],
  );

  const conflictFor = useCallback(
    (group: RSDutyGroup) => analyze(groupWindow(group)),
    [analyze, groupWindow],
  );

  return { stateOf, validate, conflictFor, summarize };
}
