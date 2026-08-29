import type { DepartmentData, RoutineEntry } from "../types";

// Tagged assignment tokens sent to the backend. Kept as string literals so
// the dropdown <select> can store them directly.
export type AssignmentToken = string; // "course:<id>" | "group:<id>"

export const courseToken = (courseId: string): AssignmentToken => `course:${courseId}`;
export const groupToken = (groupId: string): AssignmentToken => `group:${groupId}`;

export type ParsedToken =
  | { kind: "course"; id: string }
  | { kind: "group"; id: string };

export function parseAssignmentToken(token: string | undefined | null): ParsedToken | null {
  if (!token) return null;
  const idx = token.indexOf(":");
  if (idx < 0) return { kind: "course", id: token }; // legacy bare courseId
  const kind = token.slice(0, idx);
  const id = token.slice(idx + 1);
  if (!id) return null;
  if (kind === "course" || kind === "group") return { kind, id };
  return null;
}

// One selectable option in the routine dropdown — either a single core course
// or an aggregated elective group.
export type RoutineOption =
  | { token: AssignmentToken; label: string; kind: "course"; courseId: string }
  | {
      token: AssignmentToken;
      label: string;
      kind: "group";
      groupId: string;
      memberCourseIds: string[];
    };

/**
 * Build the list of selectable entries for one dept's routine cell.
 * Cores stay individual; electives collapse into their groups (one option
 * per group). If an elective isn't linked to a group (edge case), it's shown
 * as a plain course.
 */
export function buildRoutineOptions(dept: DepartmentData): RoutineOption[] {
  const options: RoutineOption[] = [];
  const seenGroupIds = new Set<string>();
  const membersByGroupId = new Map<string, string[]>();
  const groupNameById = new Map<string, string>();

  for (const c of dept.courses) {
    const grp = c.electiveGroup;
    if (grp && grp._id) {
      const list = membersByGroupId.get(grp._id) || [];
      list.push(c._id);
      membersByGroupId.set(grp._id, list);
      if (!groupNameById.has(grp._id)) groupNameById.set(grp._id, grp.name);
    }
  }

  for (const c of dept.courses) {
    const grp = c.electiveGroup;
    if (grp && grp._id) {
      if (seenGroupIds.has(grp._id)) continue;
      seenGroupIds.add(grp._id);
      options.push({
        token: groupToken(grp._id),
        label: groupNameById.get(grp._id) || "Electives",
        kind: "group",
        groupId: grp._id,
        memberCourseIds: membersByGroupId.get(grp._id) || [],
      });
    } else {
      options.push({
        token: courseToken(c._id),
        label: `${c.code} — ${c.name}`,
        kind: "course",
        courseId: c._id,
      });
    }
  }

  return options;
}

/**
 * True when a token is already assigned to this dept in some other slot.
 * Used to grey out "used" options in the dropdown so the same course/group
 * can't be scheduled twice per dept.
 */
export function isTokenUsedInRoutine(
  routine: RoutineEntry[],
  deptId: string,
  token: AssignmentToken
): boolean {
  return routine.some((entry) => entry.assignments[deptId] === token);
}

/**
 * Resolve any legacy bare courseId assignment into its tagged form so tags
 * flow through the payload consistently.
 */
export function normalizeAssignmentToken(
  raw: string | undefined | null,
  dept: DepartmentData
): AssignmentToken {
  if (!raw) return "";
  const parsed = parseAssignmentToken(raw);
  if (!parsed) return "";
  if (parsed.kind === "group") return groupToken(parsed.id);
  // If the referenced course belongs to an elective group, promote to the
  // group token so future edits stay consistent.
  const c = dept.courses.find((x) => x._id === parsed.id);
  if (c?.electiveGroup?._id) return groupToken(c.electiveGroup._id);
  return courseToken(parsed.id);
}

/**
 * Resolve a token to the list of underlying course IDs — useful when a
 * selector needs to check "is course X already scheduled" across cores and
 * groups uniformly.
 */
export function resolveTokenToCourseIds(
  token: AssignmentToken,
  dept: DepartmentData
): string[] {
  const parsed = parseAssignmentToken(token);
  if (!parsed) return [];
  if (parsed.kind === "course") return [parsed.id];
  return dept.courses
    .filter((c) => c.electiveGroup?._id === parsed.id)
    .map((c) => c._id);
}
