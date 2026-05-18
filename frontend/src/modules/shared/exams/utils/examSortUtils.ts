import type { ExamGroup, ExamGroupStatus } from "../types/exam.types";
import { getExamGroupStatus } from "./examStatusUtils";

// Lower = earlier in render order. ONGOING first, then UPCOMING, then
// COMPLETED — the inversion from "upcoming first" is intentional: a CS
// landing on /exams cares most about exams happening right now.
const STATUS_PRIORITY: Record<ExamGroupStatus, number> = {
  ongoing: 0,
  upcoming: 1,
  completed: 2,
};

/**
 * Compare two exam groups by status priority first, then by nearest-date
 * within the same status:
 *   • ongoing   → ascending startDate (today's earliest start first)
 *   • upcoming  → ascending startDate (nearest upcoming first)
 *   • completed → descending endDate  (most recently completed first)
 *
 * Pure comparator — accepts already-computed statuses to avoid recomputing
 * inside a sort. Callers without statuses should use sortExamsByPriority.
 */
export function compareExams(
  a: ExamGroup,
  b: ExamGroup,
  statusA: ExamGroupStatus,
  statusB: ExamGroupStatus,
): number {
  const dp = STATUS_PRIORITY[statusA] - STATUS_PRIORITY[statusB];
  if (dp !== 0) return dp;

  if (statusA === "completed") {
    // Most recently completed first.
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
  }
  // ongoing + upcoming: nearest start date first.
  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
}

/** Convenience: sort a list of exams by status priority + nearest date. */
export function sortExamsByPriority<T extends ExamGroup>(exams: T[]): T[] {
  return [...exams].sort((a, b) =>
    compareExams(a, b, getExamGroupStatus(a), getExamGroupStatus(b)),
  );
}

/**
 * Bucket a list of exams by status — keeps each bucket in the
 * within-status order (nearest-date / most-recently-completed first).
 */
export function bucketByStatus<T extends ExamGroup>(
  exams: T[],
): Record<ExamGroupStatus, T[]> {
  const out: Record<ExamGroupStatus, T[]> = {
    ongoing: [],
    upcoming: [],
    completed: [],
  };
  for (const e of exams) {
    out[getExamGroupStatus(e)].push(e);
  }
  // Sort each bucket using the same within-status rule as compareExams.
  out.ongoing.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
  out.upcoming.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
  out.completed.sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );
  return out;
}

export const STATUS_RENDER_ORDER: ExamGroupStatus[] = [
  "ongoing",
  "upcoming",
  "completed",
];
