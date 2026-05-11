import type { DepartmentData, Shift, RoutineEntry } from "../types";
import { generateExamDates, generateDatesBetween } from "./dateUtils";

// ---------- Core Stats ----------

export interface ExamStats {
  maxCourses: number;
  shiftsPerDay: number;
  requiredDays: number;
  totalSlots: number;
  extraSlots: number;
}

/**
 * Calculate all exam scheduling stats from departments and shifts.
 * Pure function — no side effects, no dates involved.
 */
export function calculateExamStats(
  departments: DepartmentData[],
  shifts: Shift[]
): ExamStats {
  const courseCounts = departments.map((d) => d.courses.length);
  const maxCourses = Math.max(...courseCounts, 0);
  const shiftsPerDay = shifts.length;
  const requiredDays = shiftsPerDay === 0 ? 0 : Math.ceil(maxCourses / shiftsPerDay);
  const totalSlots = requiredDays * shiftsPerDay;
  const extraSlots = totalSlots - maxCourses;

  return { maxCourses, shiftsPerDay, requiredDays, totalSlots, extraSlots };
}

// ---------- Date-aware info ----------

export interface DateInfo {
  maxCourses: number;
  shiftsPerDay: number;
  requiredDays: number;
  totalSlots: number;
  extraSlots: number;
  dates: string[];
  skippedSundays: string[];
  endDate: string;
}

/**
 * Auto mode: calculate dates forward from startDate using requiredDays.
 */
export function calculateDateInfoAuto(
  departments: DepartmentData[],
  shifts: Shift[],
  startDate: string
): DateInfo {
  const stats = calculateExamStats(departments, shifts);
  const { dates, skippedSundays } = generateExamDates(startDate, stats.requiredDays);

  return {
    ...stats,
    dates,
    skippedSundays,
    endDate: dates.length > 0 ? dates[dates.length - 1] : "",
  };
}

/**
 * Manual mode: calculate dates from a user-chosen start + end date range.
 * Re-derives requiredDays, totalSlots, extraSlots from the actual range.
 */
export function calculateDateInfoManual(
  departments: DepartmentData[],
  shifts: Shift[],
  startDate: string,
  endDate: string
): DateInfo {
  const { dates, skippedSundays } = generateDatesBetween(startDate, endDate);
  const courseCounts = departments.map((d) => d.courses.length);
  const maxCourses = Math.max(...courseCounts, 0);
  const shiftsPerDay = shifts.length;
  const workingDays = dates.length;
  const totalSlots = workingDays * shiftsPerDay;
  const extraSlots = totalSlots - maxCourses;

  return {
    maxCourses,
    shiftsPerDay,
    requiredDays: workingDays,
    totalSlots,
    extraSlots,
    dates,
    skippedSundays,
    endDate: dates.length > 0 ? dates[dates.length - 1] : "",
  };
}

// ---------- Routine helpers ----------

/**
 * Build an initial empty routine from dates and shifts.
 */
export function buildEmptyRoutine(
  dates: string[],
  shifts: Shift[],
  departmentIds: string[]
): RoutineEntry[] {
  const routine: RoutineEntry[] = [];

  for (const date of dates) {
    for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex++) {
      const assignments: Record<string, string> = {};
      for (const id of departmentIds) {
        assignments[id] = "";
      }
      routine.push({ date, shiftIndex, assignments });
    }
  }

  return routine;
}

/**
 * Check if a course is already assigned in the routine for a department.
 */
export function isCourseAssigned(
  routine: RoutineEntry[],
  departmentId: string,
  courseId: string
): boolean {
  return routine.some((entry) => entry.assignments[departmentId] === courseId);
}

/**
 * Get validation warnings for the routine.
 */
export function getRoutineWarnings(
  routine: RoutineEntry[],
  departments: DepartmentData[]
): string[] {
  const warnings: string[] = [];

  for (const dept of departments) {
    const assignedCourses = routine
      .map((e) => e.assignments[dept._id])
      .filter(Boolean);

    const unassigned = dept.courses.filter(
      (c) => !assignedCourses.includes(c._id)
    );

    if (unassigned.length > 0) {
      warnings.push(
        `${dept.code}: ${unassigned.length} course(s) not assigned — ${unassigned.map((c) => c.code).join(", ")}`
      );
    }
  }

  const emptySlots = routine.filter((entry) =>
    Object.values(entry.assignments).every((v) => !v)
  );
  if (emptySlots.length > 0) {
    warnings.push(`${emptySlots.length} slot(s) have no courses assigned`);
  }

  return warnings;
}

// ---------- Room helpers ----------

/**
 * Calculate remaining capacity for room assignment.
 */
export function calculateRemaining(
  totalStudents: number,
  selectedCapacity: number
): number {
  return totalStudents - selectedCapacity;
}

/**
 * Calculate classes needed for remaining students.
 */
export function classesNeeded(
  remaining: number,
  avgStudentsPerClass: number
): number {
  if (remaining <= 0 || avgStudentsPerClass <= 0) return 0;
  return Math.ceil(remaining / avgStudentsPerClass);
}
