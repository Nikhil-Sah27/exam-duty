import type { Duty } from "@/modules/duties/types";
import type { RoomDutyFlags } from "@/modules/shared/exams/types/exam.types";
import {
  findTimeConflict as sharedFindTimeConflict,
  describeConflict,
} from "@/modules/shared/duties/utils/timeConflictUtils";
import {
  durationHours as sharedDurationHours,
  totalHours as sharedTotalHours,
  uniqueUpcomingDates as sharedUniqueUpcomingDates,
} from "@/modules/shared/duties/utils/dutyDurationUtils";
import type { DutySlot, SelectionValidation } from "../types";

/**
 * Invigilator-specific validation that wraps the shared time-conflict engine
 * with the single-slot "is this exact slotId already taken by my role's flag?"
 * check. Shared primitives live under @/modules/shared/duties so RS (and any
 * future role) can reuse them without duplicating logic.
 */

const ROLE_LABEL: Record<keyof RoomDutyFlags, string> = {
  invigilatorAssigned: "invigilator",
  rsAssigned: "room superintendent",
  dcsAssigned: "DCS",
};

export function findTimeConflict(
  candidate: DutySlot,
  selected: DutySlot[],
  myDuties: Duty[],
): DutySlot | Duty | null {
  return sharedFindTimeConflict(
    { id: candidate.slotId, date: candidate.date, startTime: candidate.startTime, endTime: candidate.endTime },
    selected.map((s) => ({
      id: s.slotId,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      _original: s,
    })),
    myDuties,
  ) as DutySlot | Duty | null;
}

export function validateSelection(
  candidate: DutySlot,
  selected: DutySlot[],
  myDuties: Duty[],
  flagKey: keyof RoomDutyFlags,
): SelectionValidation {
  if (candidate.flags[flagKey]) {
    return {
      ok: false,
      reason: `This slot already has an ${ROLE_LABEL[flagKey]} assigned.`,
    };
  }

  if (selected.some((s) => s.slotId === candidate.slotId)) {
    return { ok: false, reason: "This slot is already in your selection." };
  }

  // Build the lightweight TimeWindow array the shared engine expects.
  const windows = selected.map((s) => ({
    id: s.slotId,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    roomNumber: s.roomNumber,
  }));
  const conflict = sharedFindTimeConflict(
    { id: candidate.slotId, date: candidate.date, startTime: candidate.startTime, endTime: candidate.endTime },
    windows,
    myDuties,
  );
  if (conflict) {
    return {
      ok: false,
      reason: `Time conflict with ${describeConflict(conflict as never)} on the same day.`,
    };
  }

  return { ok: true };
}

export function durationHours(slot: DutySlot): number {
  return sharedDurationHours(slot);
}

export function totalHours(slots: DutySlot[]): number {
  return sharedTotalHours(slots);
}

export function uniqueUpcomingDates(slots: DutySlot[]): string[] {
  return sharedUniqueUpcomingDates(slots);
}
