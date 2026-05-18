import { useCallback } from "react";
import type { Duty } from "@/modules/duties/types";
import {
  findTimeConflict,
  describeConflict,
} from "@/modules/shared/duties/utils/timeConflictUtils";
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
 * Conflict detection reuses the shared `findTimeConflict` engine. RS groups
 * are pre-checked against (other selected groups + my persisted duties).
 */
export function useRSDutyAvailability(
  selected: RSDutyGroup[],
  myDuties: Duty[],
) {
  const stateOf = useCallback(
    (group: RSDutyGroup): RSGroupState => {
      if (selected.some((s) => s.groupId === group.groupId)) return "SELECTED";
      if (group.allAssigned) return "FULL";
      const conflict = findConflictWith(group, selected, myDuties);
      if (conflict) return "CONFLICT";
      return "AVAILABLE";
    },
    [selected, myDuties],
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
      const conflict = findConflictWith(candidate, selected, myDuties);
      if (conflict) {
        return {
          ok: false,
          reason: `Time conflict with ${describeConflict(conflict as never)} on the same day.`,
        };
      }
      return { ok: true };
    },
    [selected, myDuties],
  );

  return { stateOf, validate };
}

function findConflictWith(
  candidate: RSDutyGroup,
  selected: RSDutyGroup[],
  myDuties: Duty[],
) {
  const windows = selected.map((s) => ({
    id: s.groupId,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    roomNumber: s.rangeLabel,
  }));
  return findTimeConflict(
    {
      id: candidate.groupId,
      date: candidate.date,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
    },
    windows,
    myDuties,
  );
}
