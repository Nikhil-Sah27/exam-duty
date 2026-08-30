import type { Duty } from "@/shared/types";

/**
 * Mobile port of frontend/src/modules/shared/duties/utils/timeConflictUtils.ts
 * and modules/duties/utils/dutyConflictUtils.ts. Keep the overlap definition
 * in sync — it decides what a teacher is allowed to claim.
 *
 * The web also blocks against slots the user has queued but not yet submitted;
 * mobile claims one card at a time (see screens/), so the only blockers here
 * are the duties the user actually holds.
 */

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function sameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
}

export function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return (
    toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA)
  );
}

export interface TimeWindow {
  date: string;
  startTime: string;
  endTime: string;
}

/** The first assigned duty overlapping `candidate` on the same day, else null. */
export function findConflict(
  candidate: TimeWindow,
  myDuties: readonly Duty[]
): Duty | null {
  for (const d of myDuties) {
    if (d.status !== "assigned") continue;
    if (!sameDay(d.date, candidate.date)) continue;
    if (overlaps(d.startTime, d.endTime, candidate.startTime, candidate.endTime)) {
      return d;
    }
  }
  return null;
}

/** Copy-ready reason for a blocked card. Mirrors the web's getConflictReason. */
export function describeConflict(duty: Duty): string {
  const roomNumber = duty.examRoom?.room?.roomNumber || duty.room || "";
  const where = roomNumber ? `${roomNumber}, ` : "";
  return `Clashes with your duty (${where}${duty.startTime}–${duty.endTime}).`;
}
