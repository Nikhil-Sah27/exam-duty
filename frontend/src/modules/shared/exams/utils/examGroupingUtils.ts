import type { ExamGroup, ExamGroupType, Duty } from "../types/exam.types";

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
 * Top-level split used by the Exams listing page:
 *   { cie: { IA1, IA2, IA3 }, see }
 *
 * The CS landing UI renders CIE and SEE as distinct sections so they don't
 * get visually mixed; this helper centralizes the bucketing so consumers
 * don't reach into individual `examType` strings.
 */
export interface CategorizedExams<T extends ExamGroup = ExamGroup> {
  cie: Record<Extract<ExamGroupType, "IA1" | "IA2" | "IA3">, T[]>;
  see: T[];
}

export function groupExamsByCategory<T extends ExamGroup>(
  groups: T[],
): CategorizedExams<T> {
  const out: CategorizedExams<T> = {
    cie: { IA1: [], IA2: [], IA3: [] },
    see: [],
  };
  for (const g of groups) {
    if (g.examType === "SEE") {
      out.see.push(g);
    } else if (g.examType === "IA1" || g.examType === "IA2" || g.examType === "IA3") {
      out.cie[g.examType].push(g);
    }
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
