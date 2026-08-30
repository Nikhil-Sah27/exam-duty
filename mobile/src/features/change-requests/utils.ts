import type { Duty } from "@/shared/types";
import type { ChangeRequest, ReplacementSlot } from "./types";

/**
 * Client-side mirrors of the gates in
 * backend/modules/change-request/changeRequest.service.js. Ported from
 * frontend/src/modules/shared/change-requests/utils/{changeRequestValidation,
 * dutyConflictUtils}.ts.
 *
 * These never replace the server checks — they exist so the screen does not
 * offer an action that is guaranteed to come back as a 409.
 */

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isSameDay = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
};

export const overlaps = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean =>
  toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);

/** Only own, still-assigned, not-past duties accept a change request. */
export function canRequestChange(duty: Duty): ValidationResult {
  if (duty.status !== "assigned") {
    return { ok: false, reason: "This duty is no longer active." };
  }
  const day = new Date(duty.date);
  day.setHours(0, 0, 0, 0);
  if (day < startOfToday()) {
    return { ok: false, reason: "Cannot request changes for a past duty." };
  }
  return { ok: true };
}

export function hasPendingRequestForDuty(
  dutyId: string,
  requests: readonly ChangeRequest[]
): boolean {
  return requests.some((r) => r.duty?._id === dutyId && r.status === "pending");
}

/** `rsSourceKey`s the requester already has a swap in flight for. */
export function pendingRsSourceKeys(
  requests: readonly ChangeRequest[]
): Set<string> {
  const keys = new Set<string>();
  for (const r of requests) {
    if (r.status === "pending" && r.scope === "rs_group" && r.rsSourceKey) {
      keys.add(r.rsSourceKey);
    }
  }
  return keys;
}

/** DCSGroup ids the requester already has a swap in flight for. */
export function pendingDcsSourceIds(
  requests: readonly ChangeRequest[]
): Set<string> {
  const ids = new Set<string>();
  for (const r of requests) {
    if (r.status === "pending" && r.dcsSourceGroup?._id) {
      ids.add(r.dcsSourceGroup._id);
    }
  }
  return ids;
}

/**
 * Another active duty of the viewer's that overlaps this slot. The duty being
 * moved away from is excluded — vacating it is the point of the request.
 */
export function findConflictingDuty(
  window: { date: string; startTime: string; endTime: string },
  myDuties: readonly Duty[],
  excludeDutyIds: ReadonlySet<string>
): Duty | null {
  return (
    myDuties.find(
      (d) =>
        !excludeDutyIds.has(d._id) &&
        d.status === "assigned" &&
        isSameDay(d.date, window.date) &&
        overlaps(d.startTime, d.endTime, window.startTime, window.endTime)
    ) || null
  );
}

export function canSelectReplacement(
  slot: ReplacementSlot,
  currentDuty: Duty,
  myDuties: readonly Duty[]
): ValidationResult {
  const day = new Date(slot.date);
  day.setHours(0, 0, 0, 0);
  if (day < startOfToday()) {
    return { ok: false, reason: "Slot is in the past." };
  }
  const conflict = findConflictingDuty(
    slot,
    myDuties,
    new Set([currentDuty._id])
  );
  if (conflict) {
    return {
      ok: false,
      reason: `Clashes with your duty at ${conflict.room} (${conflict.startTime}–${conflict.endTime}).`,
    };
  }
  return { ok: true };
}
