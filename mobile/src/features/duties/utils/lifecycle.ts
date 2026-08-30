/**
 * Mobile port of frontend/src/modules/duties/utils/dutyStatusFilter.ts —
 * the single answer to "is this slot still selectable?". Keep in sync.
 *
 * Only the Upcoming and Ongoing buckets are selectable. A schedule whose
 * endTime has passed today, or whose date is behind us, is gone from Select
 * Duty for all three roles.
 */

export type DutyLifecycleStatus =
  | "Upcoming"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

export interface DutyTemporalRef {
  /** ISO date string (YYYY-MM-DD or full ISO). */
  date: string;
  /** HH:MM. */
  startTime: string;
  /** HH:MM. */
  endTime: string;
  /** Forces "Cancelled" regardless of dates (DCS `status === "released"`). */
  cancelled?: boolean;
}

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export function getDutyLifecycleStatus(
  ref: DutyTemporalRef,
  now: Date = new Date()
): DutyLifecycleStatus {
  if (ref.cancelled) return "Cancelled";

  const today = startOfDay(now);
  const day = startOfDay(new Date(ref.date));

  if (day < today) return "Completed";
  if (day > today) return "Upcoming";

  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < toMin(ref.startTime)) return "Upcoming";
  if (nowMin >= toMin(ref.endTime)) return "Completed";
  return "Ongoing";
}

export function isDutySelectable(ref: DutyTemporalRef, now?: Date): boolean {
  const status = getDutyLifecycleStatus(ref, now);
  return status === "Upcoming" || status === "Ongoing";
}

/** Adapter-driven filter, so DCS groups and RS/invigilator slots can share it
 *  without exposing their internal shapes. */
export function selectableFilter<T>(
  items: readonly T[],
  getTemporalRef: (item: T) => DutyTemporalRef,
  now?: Date
): T[] {
  return items.filter((item) => isDutySelectable(getTemporalRef(item), now));
}
