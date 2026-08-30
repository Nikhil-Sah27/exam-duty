import type { OperationalRole } from "@/shared/role-config";
import type {
  AssigneePublic,
  Duty,
  ExamGroup,
  ExamGroupStatus,
  ExamGroupType,
  RoomDutyFlags,
} from "@/shared/types";

/**
 * Exam-group lifecycle, category bucketing and the teacher-perspective room
 * status. Mobile port of, and kept in sync with:
 *   • frontend/src/modules/shared/exams/utils/examStatusUtils.ts
 *   • frontend/src/modules/shared/exams/utils/examSortUtils.ts
 *   • frontend/src/modules/shared/exams/utils/examGroupingUtils.ts
 *   • frontend/src/modules/shared/utils/assignmentStatusUtils.ts
 *
 * The web's paint tables are Tailwind class strings, which mean nothing to
 * React Native — they are re-expressed here as the hex values those classes
 * resolve to, so the two clients stay visually identical.
 */

/* ------------------------------------------------------- exam group state */

export function getExamGroupStatus(group: ExamGroup): ExamGroupStatus {
  const now = new Date();
  const start = new Date(group.startDate);
  const end = new Date(group.endDate);
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "ongoing";
}

/** Ongoing first — a teacher opening Exams cares most about today. */
export const STATUS_RENDER_ORDER: ExamGroupStatus[] = [
  "ongoing",
  "upcoming",
  "completed",
];

export const STATUS_LABEL: Record<ExamGroupStatus, string> = {
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  completed: "Completed",
};

export const STATUS_COLOR: Record<
  ExamGroupStatus,
  { dot: string; bg: string; text: string }
> = {
  ongoing: { dot: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  upcoming: { dot: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  completed: { dot: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
};

const TYPE_COLOR: Record<string, string> = {
  IA1: "#7c3aed",
  IA2: "#4f46e5",
  IA3: "#0891b2",
  SEE: "#9333ea",
};

export function getTypeColor(examType: string): string {
  return TYPE_COLOR[examType] || "#1f2937";
}

const TYPE_SUBTITLE: Record<string, string> = {
  IA1: "Internal Assessment 1",
  IA2: "Internal Assessment 2",
  IA3: "Internal Assessment 3",
  SEE: "Semester End Examination",
};

export function getTypeSubtitle(examType: string): string {
  return TYPE_SUBTITLE[examType] || examType;
}

/* ------------------------------------------------------------- bucketing */

export type CieType = Extract<ExamGroupType, "IA1" | "IA2" | "IA3">;
export const CIE_TYPES: CieType[] = ["IA1", "IA2", "IA3"];

export interface CategorizedExams {
  cie: Record<CieType, ExamGroup[]>;
  see: ExamGroup[];
}

export function groupExamsByCategory(groups: ExamGroup[]): CategorizedExams {
  const out: CategorizedExams = { cie: { IA1: [], IA2: [], IA3: [] }, see: [] };
  for (const g of groups) {
    if (g.examType === "SEE") out.see.push(g);
    else out.cie[g.examType].push(g);
  }
  return out;
}

/**
 * Split by status, each bucket ordered the way the web orders it: nearest
 * start date first for ongoing/upcoming, most recently finished first for
 * completed.
 */
export function bucketByStatus(
  exams: ExamGroup[]
): Record<ExamGroupStatus, ExamGroup[]> {
  const out: Record<ExamGroupStatus, ExamGroup[]> = {
    ongoing: [],
    upcoming: [],
    completed: [],
  };
  for (const e of exams) out[getExamGroupStatus(e)].push(e);

  const byStart = (a: ExamGroup, b: ExamGroup) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  out.ongoing.sort(byStart);
  out.upcoming.sort(byStart);
  out.completed.sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
  return out;
}

/* --------------------------------------------------- my duty in this room */

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Match a duty to a room by the physical Room id whenever both sides expose
 * one. The legacy string form is a bare room number and would collide across
 * buildings, so it is only a last resort.
 */
function dutyMatchesRoom(d: Duty, roomNumber: string, roomId: string): boolean {
  const dutyRoomId = d.examRoom?.room?._id;
  if (dutyRoomId && roomId) return dutyRoomId === roomId;
  return d.room === roomNumber;
}

export function isMyDutyInRoom(
  duties: Duty[],
  scheduleDate: string,
  startTime: string,
  endTime: string,
  roomNumber: string,
  roomId: string
): boolean {
  const target = new Date(scheduleDate);
  target.setHours(0, 0, 0, 0);
  return duties.some((d) => {
    if (d.status !== "assigned") return false;
    const day = new Date(d.date);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() !== target.getTime()) return false;
    if (d.startTime !== startTime || d.endTime !== endTime) return false;
    return dutyMatchesRoom(d, roomNumber, roomId);
  });
}

/**
 * True when the viewer holds another duty that overlaps this slot's window on
 * the same day — taking this room would clash. The slot itself is skipped, as
 * that reads as MINE rather than a conflict.
 */
export function hasTimeConflictForSlot(
  duties: Duty[],
  scheduleDate: string,
  startTime: string,
  endTime: string,
  roomNumber: string,
  roomId: string
): boolean {
  const target = new Date(scheduleDate);
  target.setHours(0, 0, 0, 0);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  return duties.some((d) => {
    if (d.status !== "assigned") return false;
    const day = new Date(d.date);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() !== target.getTime()) return false;
    const sameSlot =
      d.startTime === startTime &&
      d.endTime === endTime &&
      dutyMatchesRoom(d, roomNumber, roomId);
    if (sameSlot) return false;
    return toMinutes(d.startTime) < end && start < toMinutes(d.endTime);
  });
}

/* --------------------------------------------- teacher-perspective status */

export type TeacherAssignmentStatus =
  | "AVAILABLE"
  | "MINE"
  | "OCCUPIED"
  | "CONFLICT";

const FLAG_KEY_BY_ROLE: Record<OperationalRole, keyof RoomDutyFlags> = {
  invigilator: "invigilatorAssigned",
  rs: "rsAssigned",
  dcs: "dcsAssigned",
};

const TEACHER_KEY_BY_ROLE: Record<
  OperationalRole,
  "invigilatorTeacher" | "rsTeacher" | "dcsTeacher"
> = {
  invigilator: "invigilatorTeacher",
  rs: "rsTeacher",
  dcs: "dcsTeacher",
};

export function getRoleAssignee(
  flags: RoomDutyFlags | undefined,
  role: OperationalRole
): AssigneePublic | null {
  if (!flags) return null;
  return flags[TEACHER_KEY_BY_ROLE[role]] ?? null;
}

/**
 * "Can I take this room?" from the viewer's seat. MINE beats OCCUPIED so the
 * chip reads as the viewer's own duty; CONFLICT beats AVAILABLE so a slot that
 * would fail server-side validation never looks free.
 */
export function getTeacherAssignmentStatus(args: {
  flags: RoomDutyFlags | undefined;
  viewerRole: OperationalRole;
  myUserId: string | null | undefined;
  isMine?: boolean;
  hasConflict?: boolean;
}): TeacherAssignmentStatus {
  const { flags, viewerRole, myUserId, isMine, hasConflict } = args;
  if (isMine) return "MINE";
  if (flags?.[FLAG_KEY_BY_ROLE[viewerRole]]) {
    const assignee = getRoleAssignee(flags, viewerRole);
    if (assignee && myUserId && assignee._id === myUserId) return "MINE";
    return "OCCUPIED";
  }
  if (hasConflict) return "CONFLICT";
  return "AVAILABLE";
}

export const ASSIGNMENT_LABEL: Record<TeacherAssignmentStatus, string> = {
  AVAILABLE: "Available",
  MINE: "My duty",
  OCCUPIED: "Occupied",
  CONFLICT: "Time conflict",
};

export const ASSIGNMENT_COLOR: Record<
  TeacherAssignmentStatus,
  { border: string; bg: string; dot: string; text: string }
> = {
  AVAILABLE: {
    border: "#6ee7b7",
    bg: "#ecfdf5",
    dot: "#10b981",
    text: "#047857",
  },
  MINE: { border: "#60a5fa", bg: "#eff6ff", dot: "#3b82f6", text: "#1d4ed8" },
  OCCUPIED: {
    border: "#fca5a5",
    bg: "#fef2f2",
    dot: "#ef4444",
    text: "#b91c1c",
  },
  CONFLICT: {
    border: "#fca5a5",
    bg: "#fef2f2",
    dot: "#ef4444",
    text: "#b91c1c",
  },
};
