import type { DepartmentData, RoutineEntry } from "../types";
import { parseAssignmentToken } from "../utils/routineOptionUtils";

// Elective groups collapse to one option per dept. That means "unassigned"
// warnings should count electives at the *group* level, not per member course.
// Cores continue to warn per individual course.

interface DeptWarningIndex {
  allSchedulableIds: Set<string>; // course IDs for cores + electiveGroup IDs for electives
  labelById: Map<string, string>;
}

function buildWarningIndex(dept: DepartmentData): DeptWarningIndex {
  const allSchedulableIds = new Set<string>();
  const labelById = new Map<string, string>();
  const seenGroupIds = new Set<string>();
  for (const c of dept.courses) {
    const grp = c.electiveGroup;
    if (grp && grp._id) {
      if (seenGroupIds.has(grp._id)) continue;
      seenGroupIds.add(grp._id);
      allSchedulableIds.add(grp._id);
      labelById.set(grp._id, grp.name);
    } else {
      allSchedulableIds.add(c._id);
      labelById.set(c._id, c.code);
    }
  }
  return { allSchedulableIds, labelById };
}

function scheduledIdFromToken(token: string): string | null {
  const parsed = parseAssignmentToken(token);
  if (!parsed) return null;
  return parsed.id;
}

export function isCourseAssigned(
  routine: RoutineEntry[],
  departmentId: string,
  courseIdOrToken: string
): boolean {
  const targetId = scheduledIdFromToken(courseIdOrToken);
  return routine.some((entry) => {
    const t = entry.assignments[departmentId];
    if (!t) return false;
    const id = scheduledIdFromToken(t);
    return id === targetId;
  });
}

export function getRoutineWarnings(
  routine: RoutineEntry[],
  departments: DepartmentData[]
): string[] {
  const warnings: string[] = [];

  for (const dept of departments) {
    const idx = buildWarningIndex(dept);
    const scheduled = new Set<string>();
    for (const entry of routine) {
      const token = entry.assignments[dept._id];
      const id = token ? scheduledIdFromToken(token) : null;
      if (id) scheduled.add(id);
    }
    const missing = [...idx.allSchedulableIds].filter((id) => !scheduled.has(id));
    if (missing.length > 0) {
      warnings.push(
        `${dept.code}: ${missing.length} entry(ies) not scheduled — ${missing
          .map((id) => idx.labelById.get(id) || id)
          .join(", ")}`
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

// ──────────────────────────────────────────────
// Same-course-code slot alignment
// ──────────────────────────────────────────────
// Rule: courses sharing (semester.name, course.code) across departments must
// be scheduled in the same (date, shiftIndex) slot. Only applies to *course*
// tokens — elective group tokens don't have a shared code across depts.

export interface SameCodeSlot {
  date: string;
  shiftIndex: number;
  deptCode: string;
  courseName: string;
}

export interface SameCodeConflict {
  semesterName: string;
  courseCode: string;
  placements: SameCodeSlot[];
}

export function getSameCodeSlotConflicts(
  routine: RoutineEntry[],
  departments: DepartmentData[]
): SameCodeConflict[] {
  const courseIndex = new Map<
    string,
    { deptCode: string; semesterName: string; courseCode: string; courseName: string }
  >();
  for (const dept of departments) {
    for (const course of dept.courses) {
      courseIndex.set(course._id, {
        deptCode: dept.code,
        semesterName: dept.semester.name,
        courseCode: course.code,
        courseName: course.name,
      });
    }
  }

  const groups = new Map<string, SameCodeSlot[]>();
  for (const entry of routine) {
    for (const [deptId, token] of Object.entries(entry.assignments)) {
      if (!token) continue;
      const parsed = parseAssignmentToken(token);
      if (!parsed || parsed.kind !== "course") continue;
      const meta = courseIndex.get(parsed.id);
      if (!meta) continue;
      const key = `${meta.semesterName}::${meta.courseCode}`;
      const bucket = groups.get(key) || [];
      bucket.push({
        date: entry.date,
        shiftIndex: entry.shiftIndex,
        deptCode: meta.deptCode,
        courseName: meta.courseName,
      });
      groups.set(key, bucket);
      void deptId;
    }
  }

  const conflicts: SameCodeConflict[] = [];
  for (const [key, placements] of groups) {
    if (placements.length < 2) continue;
    const first = placements[0];
    const misaligned = placements.some(
      (p) => p.date !== first.date || p.shiftIndex !== first.shiftIndex
    );
    if (!misaligned) continue;
    const [semesterName, courseCode] = key.split("::");
    conflicts.push({ semesterName, courseCode, placements });
  }

  return conflicts;
}

/**
 * Returns a Set of `${deptId}::${token}` keys that participate in a same-code
 * conflict. RoutineStep uses this to grey out the offending cell.
 */
export function getConflictingAssignmentKeys(
  routine: RoutineEntry[],
  departments: DepartmentData[]
): Set<string> {
  const conflicts = getSameCodeSlotConflicts(routine, departments);
  if (conflicts.length === 0) return new Set();

  const flagged = new Set<string>();
  const conflictedCodes = new Set(
    conflicts.map((c) => `${c.semesterName}::${c.courseCode}`)
  );

  for (const dept of departments) {
    for (const course of dept.courses) {
      const key = `${dept.semester.name}::${course.code}`;
      if (conflictedCodes.has(key)) {
        // Flag under the tagged token form that the selector actually stores.
        flagged.add(`${dept._id}::course:${course._id}`);
      }
    }
  }
  return flagged;
}
