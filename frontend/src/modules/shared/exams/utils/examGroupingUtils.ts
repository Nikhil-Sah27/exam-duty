import type { ExamGroup, Duty } from "../types/exam.types";

/**
 * Group exam groups by the canonical "examType + semester" key.
 * Mostly identity since each ExamGroup is already keyed this way at the DB
 * level — but having a dedicated helper keeps grouping logic in one place
 * for views that need composite buckets (e.g. "all IA1 groups across semesters").
 */
export function groupByTypeAndSemester(
  groups: ExamGroup[]
): Map<string, ExamGroup[]> {
  const out = new Map<string, ExamGroup[]>();
  for (const g of groups) {
    const key = `${g.examType}-${g.semester}`;
    const bucket = out.get(key);
    if (bucket) bucket.push(g);
    else out.set(key, [g]);
  }
  return out;
}

export function groupByExamType(groups: ExamGroup[]): Map<string, ExamGroup[]> {
  const out = new Map<string, ExamGroup[]>();
  for (const g of groups) {
    const bucket = out.get(g.examType);
    if (bucket) bucket.push(g);
    else out.set(g.examType, [g]);
  }
  return out;
}

/**
 * Filter exam groups to those whose date range overlaps any of the user's
 * assigned duties. The Duty model's `exam` field references the legacy
 * single-exam model, so there's no direct foreign key from a Duty to its
 * ExamGroup — date-range overlap is the reliable mapping.
 */
export function filterGroupsWithMyDuties(
  groups: ExamGroup[],
  duties: Duty[]
): ExamGroup[] {
  const activeDuties = duties.filter((d) => d.status === "assigned");
  if (activeDuties.length === 0) return [];

  return groups.filter((g) => {
    const start = new Date(g.startDate);
    const end = new Date(g.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return activeDuties.some((d) => {
      const dDate = new Date(d.date);
      return dDate >= start && dDate <= end;
    });
  });
}
