import type { Duty } from "@/modules/duties/types";

export type DutySelectionState =
  | "AVAILABLE"
  | "SELECTED_BY_ME"
  | "FULLY_OCCUPIED"
  | "PENDING"
  | "CONFLICT";

export interface SlotContext {
  date: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  roomId: string;
  /** From duty-status backend — whether ANY teacher with role=invigilator already has this room/time. */
  invigilatorAssigned: boolean;
}

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

/** Does the current user already have a duty in this exact slot+room? */
export function isSelectedByMe(slot: SlotContext, myDuties: Duty[]): boolean {
  return myDuties.some((d) => {
    if (d.status !== "assigned") return false;
    if (!sameDay(d.date, slot.date)) return false;
    if (d.startTime !== slot.startTime || d.endTime !== slot.endTime) return false;
    return d.room === slot.roomNumber || d.room === slot.roomId;
  });
}

/**
 * Time-conflict check: does the user have ANY other active duty that overlaps
 * this slot's time window? Excludes the slot itself (so toggling doesn't
 * report a self-conflict).
 */
export function hasTimeConflict(slot: SlotContext, myDuties: Duty[]): boolean {
  return myDuties.some((d) => {
    if (d.status !== "assigned") return false;
    if (!sameDay(d.date, slot.date)) return false;
    const sameSlot =
      d.startTime === slot.startTime &&
      d.endTime === slot.endTime &&
      (d.room === slot.roomNumber || d.room === slot.roomId);
    if (sameSlot) return false;
    return overlaps(d.startTime, d.endTime, slot.startTime, slot.endTime);
  });
}

/**
 * Reusable availability gate. Pure: caller passes the relevant context.
 * Pending support is plumbed but unused until the backend exposes a request
 * workflow.
 */
export function isDutyAvailable(
  slot: SlotContext,
  myDuties: Duty[],
  isPending: boolean = false
): boolean {
  if (isPending) return false;
  if (slot.invigilatorAssigned) return false;
  if (isSelectedByMe(slot, myDuties)) return false;
  if (hasTimeConflict(slot, myDuties)) return false;
  return true;
}

export function deriveSelectionState(
  slot: SlotContext,
  myDuties: Duty[],
  isPending: boolean = false
): DutySelectionState {
  if (isSelectedByMe(slot, myDuties)) return "SELECTED_BY_ME";
  if (isPending) return "PENDING";
  if (slot.invigilatorAssigned) return "FULLY_OCCUPIED";
  if (hasTimeConflict(slot, myDuties)) return "CONFLICT";
  return "AVAILABLE";
}
