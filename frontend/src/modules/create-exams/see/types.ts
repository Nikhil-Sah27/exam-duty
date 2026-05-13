import type { DepartmentData } from "../types";

/**
 * One scheduled course in the SEE routine being built. The course reference
 * is stored as the full Course shape so the preview list can show code/title
 * without re-querying.
 */
export interface SEERoutineEntry {
  /** Stable client-side id so list reorders/edits don't desync. */
  localId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  date: string;
  startTime: string;
  endTime: string;
}

/** Payload for POST /create-exams/see/plan */
export interface SEEPlanPayload {
  departmentId: string;
  semester: string;
  schedules: {
    courseId: string;
    date: string;
    startTime: string;
    endTime: string;
  }[];
}

/** Server response — extends ExamGroup with a courseId → scheduleId mapping. */
export interface SEEPlanResponse {
  _id: string;
  examType: "SEE";
  semester: number;
  startDate: string;
  endDate: string;
  scheduleMapping: Record<string, string>;
}

/** Re-export so consumers in /see can import everything from this module. */
export type { DepartmentData };
