import type { Duty } from "@/modules/duties/types";
import type { ReplacementSlot } from "../types/changeRequest.types";

const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const sameDay = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
};

const overlaps = (aS: string, aE: string, bS: string, bE: string): boolean =>
  toMinutes(aS) < toMinutes(bE) && toMinutes(bS) < toMinutes(aE);

/**
 * Does the user have another active duty that overlaps the replacement slot's
 * time window? Excludes the duty currently being moved.
 */
export function findConflictingDuty(
  slot: ReplacementSlot,
  myDuties: Duty[],
  excludeDutyId: string
): Duty | null {
  return (
    myDuties.find(
      (d) =>
        d._id !== excludeDutyId &&
        d.status === "assigned" &&
        sameDay(d.date, slot.date) &&
        overlaps(d.startTime, d.endTime, slot.startTime, slot.endTime)
    ) || null
  );
}

export function describeConflict(d: Duty): string {
  return `${d.room} (${d.startTime}–${d.endTime}) on the same day`;
}
