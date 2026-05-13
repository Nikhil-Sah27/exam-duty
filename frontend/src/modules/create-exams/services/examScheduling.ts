import type { DepartmentData, Shift, RoutineEntry } from "../types";
import { generateExamDates, generateDatesBetween } from "../utils/dateUtils";

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

