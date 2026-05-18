import { toMinutes } from "./timeConflictUtils";

/**
 * Time-aggregation helpers used by every role's "your selection" panel
 * (Invigilator: per-slot; RS: per-group, where every room in a group shares
 * the same start/end so summing the group's window is correct).
 */

export interface DurationItem {
  startTime: string;
  endTime: string;
  date: string;
}

export function durationHours(item: DurationItem): number {
  return (toMinutes(item.endTime) - toMinutes(item.startTime)) / 60;
}

export function totalHours(items: readonly DurationItem[]): number {
  return items.reduce((sum, i) => sum + durationHours(i), 0);
}

export function uniqueUpcomingDates(items: readonly DurationItem[]): string[] {
  const set = new Set<string>();
  for (const i of items) {
    const d = new Date(i.date);
    d.setHours(0, 0, 0, 0);
    set.add(d.toISOString());
  }
  return [...set].sort();
}
