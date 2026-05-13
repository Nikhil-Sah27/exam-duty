import type { SEERoutineEntry } from "../types";

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const sameDay = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
};

const overlaps = (aS: string, aE: string, bS: string, bE: string): boolean =>
  toMinutes(aS) < toMinutes(bE) && toMinutes(bS) < toMinutes(aE);

const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Validate a candidate scheduling input against the existing routine.
 * `editingLocalId` lets the "edit" flow exclude the row being edited from
 * duplicate / overlap checks.
 */
export function validateScheduleEntry(
  candidate: { courseId: string; date: string; startTime: string; endTime: string },
  routine: SEERoutineEntry[],
  editingLocalId: string | null = null,
): ValidationResult {
  if (!candidate.courseId) return { ok: false, reason: "Pick a course first." };
  if (!candidate.date) return { ok: false, reason: "Pick an exam date." };
  if (!candidate.startTime || !candidate.endTime) {
    return { ok: false, reason: "Set the start and end times." };
  }
  if (toMinutes(candidate.startTime) >= toMinutes(candidate.endTime)) {
    return { ok: false, reason: "End time must be after start time." };
  }

  const day = new Date(candidate.date);
  day.setHours(0, 0, 0, 0);
  if (day < today()) {
    return { ok: false, reason: "Exam date cannot be in the past." };
  }

  // Duplicate-course check (the spec's "same subject cannot appear twice").
  const dup = routine.find(
    (r) => r.courseId === candidate.courseId && r.localId !== editingLocalId,
  );
  if (dup) {
    return { ok: false, reason: "This course is already scheduled." };
  }

  // Overlap check against the rest of the routine.
  const overlap = routine.find((r) => {
    if (r.localId === editingLocalId) return false;
    if (!sameDay(r.date, candidate.date)) return false;
    return overlaps(r.startTime, r.endTime, candidate.startTime, candidate.endTime);
  });
  if (overlap) {
    return {
      ok: false,
      reason: `Conflicts with ${overlap.courseCode} (${overlap.startTime}–${overlap.endTime}) on the same day.`,
    };
  }

  return { ok: true };
}

/** Courses already scheduled (used to grey out the dropdown options). */
export function getScheduledCourseIds(routine: SEERoutineEntry[]): Set<string> {
  return new Set(routine.map((r) => r.courseId));
}
