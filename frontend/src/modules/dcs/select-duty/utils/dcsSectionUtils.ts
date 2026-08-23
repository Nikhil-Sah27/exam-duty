import type { DcsGroup } from "../types";

/**
 * Categorised view for DCS supervision groups. A section is a `(date,
 * startTime, endTime)` bucket; the header renders once above every DCS group
 * that runs at that window. Mirrors `sectionizeRSGroupsByDateTime` for RS —
 * DCS just keys off `schedule.*` instead of the flat RS fields.
 */
export interface DcsDateTimeSection {
  sectionId: string;
  date: string;
  startTime: string;
  endTime: string;
  groups: DcsGroup[];
}

/**
 * Pure — safe inside a memo. Preserves input order within each section so
 * cross-schedule display ordinals (built elsewhere) remain stable, and sorts
 * sections themselves by date → startTime → endTime.
 */
export function sectionizeDcsGroupsByDateTime(
  groups: readonly DcsGroup[],
): DcsDateTimeSection[] {
  if (groups.length === 0) return [];

  const buckets = new Map<string, DcsDateTimeSection>();
  for (const g of groups) {
    const { date, startTime, endTime } = g.schedule;
    const sectionId = `${date}|${startTime}|${endTime}`;
    const existing = buckets.get(sectionId);
    if (existing) {
      existing.groups.push(g);
    } else {
      buckets.set(sectionId, {
        sectionId,
        date,
        startTime,
        endTime,
        groups: [g],
      });
    }
  }

  return [...buckets.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
    return a.endTime < b.endTime ? -1 : a.endTime > b.endTime ? 1 : 0;
  });
}
