import type { Duty } from "@/modules/duties/types";
import type {
  ChangeRequest,
  ReplacementSlot,
} from "../types/changeRequest.types";
import { findConflictingDuty } from "./dutyConflictUtils";

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

const TODAY_START = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Can the logged-in invigilator submit a change request against this duty?
 * Mirrors the backend gate: only own, assigned, not-past duties.
 */
export function canRequestChange(duty: Duty): ValidationResult {
  if (duty.status !== "assigned") {
    return { ok: false, reason: "This duty is no longer active." };
  }
  const dutyDay = new Date(duty.date);
  dutyDay.setHours(0, 0, 0, 0);
  if (dutyDay < TODAY_START()) {
    return { ok: false, reason: "Cannot request changes for a past duty." };
  }
  return { ok: true };
}

export function hasPendingRequest(
  dutyId: string,
  myRequests: ChangeRequest[]
): boolean {
  return myRequests.some(
    (r) => r.duty?._id === dutyId && r.status === "pending"
  );
}

/**
 * Is `slot` a valid replacement target for the user moving away from `currentDuty`?
 */
export function canSelectReplacement(
  slot: ReplacementSlot,
  currentDuty: Duty,
  myDuties: Duty[]
): ValidationResult {
  const slotDay = new Date(slot.date);
  slotDay.setHours(0, 0, 0, 0);
  if (slotDay < TODAY_START()) {
    return { ok: false, reason: "Slot is in the past." };
  }
  const conflict = findConflictingDuty(slot, myDuties, currentDuty._id);
  if (conflict) {
    return {
      ok: false,
      reason: `You already have another duty during this time (${conflict.room} ${conflict.startTime}–${conflict.endTime}).`,
    };
  }
  return { ok: true };
}
