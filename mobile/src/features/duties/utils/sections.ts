import type { TimeWindow } from "./conflicts";

/**
 * Date → time-slot outline, shared by every duty list on mobile.
 *
 * The web renders this as a date heading with time-slot sub-headings nested
 * inside it. React Native's SectionList only has one level of section, so the
 * two levels are flattened into one section per (date, time window) and
 * `isFirstOfDate` tells the header renderer when to also draw the date. The
 * grouping semantics — sort by date then start time, bucket in that order —
 * are the same ones the web uses in `groupUpcomingDuties` /
 * `buildRSUpcomingSummary` / `sectionizeRSGroupsByDateTime`.
 */
export interface DutySection<T> {
  /** `${dateKey}|${startTime}-${endTime}` */
  key: string;
  /** ISO YYYY-MM-DD. */
  dateKey: string;
  /** The first item's full date string, so consumers can format it. */
  date: string;
  startTime: string;
  endTime: string;
  /** True for the earliest time slot of its date — draw the date heading. */
  isFirstOfDate: boolean;
  data: T[];
}

export function buildDutySections<T>(
  items: readonly T[],
  getWindow: (item: T) => TimeWindow
): DutySection<T>[] {
  const sorted = [...items].sort((a, b) => {
    const wa = getWindow(a);
    const wb = getWindow(b);
    const da = new Date(wa.date).getTime();
    const db = new Date(wb.date).getTime();
    if (da !== db) return da - db;
    return wa.startTime.localeCompare(wb.startTime);
  });

  const buckets = new Map<string, DutySection<T>>();
  for (const item of sorted) {
    const w = getWindow(item);
    const dateKey = new Date(w.date).toISOString().slice(0, 10);
    const key = `${dateKey}|${w.startTime}-${w.endTime}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.data.push(item);
      continue;
    }
    buckets.set(key, {
      key,
      dateKey,
      date: w.date,
      startTime: w.startTime,
      endTime: w.endTime,
      isFirstOfDate: false,
      data: [item],
    });
  }

  const sections = [...buckets.values()];
  const seenDates = new Set<string>();
  for (const section of sections) {
    if (!seenDates.has(section.dateKey)) {
      seenDates.add(section.dateKey);
      section.isFirstOfDate = true;
    }
  }
  return sections;
}

export function countDates<T>(sections: readonly DutySection<T>[]): number {
  return new Set(sections.map((s) => s.dateKey)).size;
}
