import type { Duty } from "@/modules/duties/types";
import type { DutySlot, SelectionValidation } from "../types";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function sameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
}

function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

export function findTimeConflict(
  candidate: DutySlot,
  selected: DutySlot[],
  myDuties: Duty[]
): DutySlot | Duty | null {
  for (const s of selected) {
    if (s.slotId === candidate.slotId) continue;
    if (!sameDay(s.date, candidate.date)) continue;
    if (overlaps(s.startTime, s.endTime, candidate.startTime, candidate.endTime)) {
      return s;
    }
  }
  for (const d of myDuties) {
    if (d.status !== "assigned") continue;
    if (!sameDay(d.date, candidate.date)) continue;
    if (overlaps(d.startTime, d.endTime, candidate.startTime, candidate.endTime)) {
      return d;
    }
  }
  return null;
}

export function validateSelection(
  candidate: DutySlot,
  selected: DutySlot[],
  myDuties: Duty[]
): SelectionValidation {
  if (candidate.invigilatorAssigned) {
    return { ok: false, reason: "This slot already has an invigilator assigned." };
  }

  if (selected.some((s) => s.slotId === candidate.slotId)) {
    return { ok: false, reason: "This slot is already in your selection." };
  }

  const conflict = findTimeConflict(candidate, selected, myDuties);
  if (conflict) {
    const label =
      "roomNumber" in conflict
        ? `${conflict.roomNumber} (${conflict.startTime}–${conflict.endTime})`
        : `${conflict.room} (${conflict.startTime}–${conflict.endTime})`;
    return {
      ok: false,
      reason: `Time conflict with ${label} on the same day.`,
    };
  }

  return { ok: true };
}

export function durationHours(slot: DutySlot): number {
  const mins = toMinutes(slot.endTime) - toMinutes(slot.startTime);
  return mins / 60;
}

export function totalHours(slots: DutySlot[]): number {
  return slots.reduce((sum, s) => sum + durationHours(s), 0);
}

export function uniqueUpcomingDates(slots: DutySlot[]): string[] {
  const set = new Set<string>();
  for (const s of slots) {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    set.add(d.toISOString());
  }
  return [...set].sort();
}
