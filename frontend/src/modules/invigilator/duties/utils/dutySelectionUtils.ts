import type { Duty } from "@/modules/duties/types";
import type { RoomDutyFlags } from "@/modules/shared/exams/types/exam.types";

export type DutySelectionState =
  | "AVAILABLE"
  | "SELECTED_BY_ME"
  | "FULLY_OCCUPIED"
  | "PENDING"
  | "CONFLICT";

/**
 * Identifies a room+time slot for selection purposes. The full RoomDutyFlags
 * payload is carried so per-role occupancy can be checked without re-fetching.
 */
export interface SlotContext {
  date: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  roomId: string;
  flags: RoomDutyFlags;
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

/** True when the role-specific slot on this room is already occupied. */
export function isRoleSlotFull(
  slot: SlotContext,
  flagKey: keyof RoomDutyFlags
): boolean {
  return Boolean(slot.flags[flagKey]);
}

export function isDutyAvailable(
  slot: SlotContext,
  myDuties: Duty[],
  flagKey: keyof RoomDutyFlags,
  isPending: boolean = false
): boolean {
  if (isPending) return false;
  if (isRoleSlotFull(slot, flagKey)) return false;
  if (isSelectedByMe(slot, myDuties)) return false;
  if (hasTimeConflict(slot, myDuties)) return false;
  return true;
}

export function deriveSelectionState(
  slot: SlotContext,
  myDuties: Duty[],
  flagKey: keyof RoomDutyFlags,
  isPending: boolean = false
): DutySelectionState {
  if (isSelectedByMe(slot, myDuties)) return "SELECTED_BY_ME";
  if (isPending) return "PENDING";
  if (isRoleSlotFull(slot, flagKey)) return "FULLY_OCCUPIED";
  if (hasTimeConflict(slot, myDuties)) return "CONFLICT";
  return "AVAILABLE";
}
