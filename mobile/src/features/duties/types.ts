import type { TimeWindow } from "./utils/conflicts";

/**
 * One row on Select Duty, whatever the role's unit of work is: a single
 * ExamRoom for an invigilator, a derived 5-room chunk for RS, a persisted
 * DCSGroup for DCS. The three role hooks all produce this shape so the screen
 * chrome — sectioning, the blocked-row reveal, the claim flow — is written
 * once instead of three times.
 */
export type SlotAvailability =
  /** Claimable right now. */
  | "AVAILABLE"
  /** This role's slot is already occupied by someone else. */
  | "TAKEN"
  /** Already claimed by the viewer — shown for context, never claimable. */
  | "MINE"
  /** Overlaps a duty the viewer already holds. */
  | "CONFLICT";

export interface SelectableEntry<T> {
  /** Stable identity: slotId for a room, groupId for RS, _id for DCS. */
  key: string;
  item: T;
  window: TimeWindow;
  availability: SlotAvailability;
  /** Plain-language reason the row cannot be claimed; null when AVAILABLE. */
  blockedReason: string | null;
}
