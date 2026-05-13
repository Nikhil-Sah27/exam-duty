import type { DepartmentData, RoutineEntry } from "../types";

export function isCourseAssigned(
  routine: RoutineEntry[],
  departmentId: string,
  courseId: string
): boolean {
  return routine.some((entry) => entry.assignments[departmentId] === courseId);
}

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

export function getTotalExamsInRoutine(routine: RoutineEntry[]): number {
  return routine.reduce(
    (sum, entry) => sum + Object.values(entry.assignments).filter(Boolean).length,
    0
  );
}
