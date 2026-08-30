/**
 * Mobile mirror of the web's shared type surface. There is no monorepo tooling
 * here, so — following the convention already used by
 * backend/shared/utils/roleResolver.js and its frontend twin — the shapes are
 * hand-copied and marked. Keep in sync with:
 *   • frontend/src/shared/lib/types.ts                     (User, UserRole)
 *   • frontend/src/modules/auth/types.ts                   (auth responses)
 *   • frontend/src/modules/exams/types.ts                  (exam group / room / duty flags)
 *   • frontend/src/modules/duties/types.ts                 (Duty)
 *   • frontend/src/modules/notifications/types.ts          (Notification)
 *   • frontend/src/modules/change-requests/types/index.ts  (ChangeRequest)
 *   • frontend/src/modules/dcs/select-duty/types.ts        (DcsGroup)
 *   • frontend/src/modules/rs/select-duty/types.ts         (RSDutyGroup)
 *
 * Only the shapes the mobile screens consume are ported. Admin-only shapes
 * (broadcast targeting, exam authoring, audit) are deliberately left out —
 * the mobile app is Invigilator / RS / DCS only.
 */

/* ------------------------------------------------------------------ user */

export type UserRole = "cs" | "dcs" | "rs" | "invigilator";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  roles: UserRole[];
  activeRole: UserRole | null;
  /** Email / WhatsApp copies. In-app delivery is never affected by these. */
  emailNotifications?: boolean;
  whatsappNotifications?: boolean;
}

/* ------------------------------------------------------------------ auth */

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Backend login response.
 * - Single-role user: token is set, tempToken is null.
 * - Multi-role user: tempToken is set, token is null, requiresRoleSelection = true.
 */
export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string | null;
    tempToken?: string | null;
    requiresRoleSelection?: boolean;
  };
}

export interface SelectRoleResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

/* ------------------------------------------------------------------ exam */

export type ExamGroupType = "IA1" | "IA2" | "IA3" | "SEE";
export type ExamGroupStatus = "upcoming" | "ongoing" | "completed";

export interface ExamGroup {
  _id: string;
  examType: ExamGroupType;
  semester: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: { _id: string; name: string; email: string };
  totalSchedules: number;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * What course(s) are being written in this exam slot. Multi-department
 * schedules carry one entry per (department × course).
 */
export interface ScheduleCourse {
  courseId?: string;
  courseCode: string | null;
  courseTitle: string | null;
  credits: number | null;
  courseType: "core" | "professional_elective" | "open_elective" | null;
  electiveGroupId?: string | null;
  electiveGroupName?: string | null;
  electiveGroupType?: "professional" | "open" | null;
  departmentCode: string | null;
  departmentName: string | null;
}

export interface ExamRoomAssignment {
  _id: string;
  schedule: string;
  room: {
    _id: string;
    roomNumber: string;
    floor: number;
    capacity: number;
    building: {
      _id: string;
      name: string;
    };
  };
  departments: string[];
}

export interface ExamSchedule {
  _id: string;
  examGroup: string;
  date: string;
  startTime: string;
  endTime: string;
  rooms: ExamRoomAssignment[];
  /** Empty when the plan hasn't been wired (legacy single-exam flow). */
  courses?: ScheduleCourse[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamGroupDetails extends ExamGroup {
  schedules: ExamSchedule[];
}

/**
 * Public-facing assignee snapshot. The backend strips password + isActive and
 * only exposes contact-relevant fields, so a teacher screen can show who
 * currently owns each role on a room.
 */
export interface AssigneePublic {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  roles: UserRole[];
  department: string | null;
  designation: string | null;
}

/**
 * Per-role occupancy of one exam room. The boolean a given screen reads is
 * decided by the logged-in role's `flagKey` — see src/shared/role-config.ts.
 */
export interface RoomDutyFlags {
  dcsAssigned: boolean;
  rsAssigned: boolean;
  invigilatorAssigned: boolean;
  dcsTeacher?: AssigneePublic | null;
  rsTeacher?: AssigneePublic | null;
  invigilatorTeacher?: AssigneePublic | null;
}

/** Map of examRoomId → duty flags. */
export type DutyStatusMap = Record<string, RoomDutyFlags>;

/* ------------------------------------------------------------------ duty */

export type DutyStatus = "assigned" | "completed" | "cancelled";

/**
 * A Duty references EITHER the legacy `exam` model OR the newer
 * `examSchedule` + `examRoom` pair. Both are populated lazily — consumers
 * must be defensive.
 */
export interface Duty {
  _id: string;
  exam: {
    _id: string;
    name: string;
    date: string;
    department: string;
    semester: number;
    type: string;
  } | null;
  examSchedule: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    examGroup?: {
      _id: string;
      examType: string;
      semester: number;
    };
  } | null;
  examRoom: {
    _id: string;
    departments: string[];
    room?: {
      _id: string;
      roomNumber: string;
      floor: number;
      capacity: number;
      building?: { _id: string; name: string };
    };
  } | null;
  teacher: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  isSelfAssigned: boolean;
  status: DutyStatus;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------ duty slots */

/**
 * One (schedule × examRoom) pair a teacher could claim. Emitted regardless of
 * occupancy — the caller filters on `flags[roleConfig.flagKey]`.
 *
 * Invigilators claim a single slot. RS and DCS never do: they work on GROUPS
 * of rooms, so their screens consume RSDutyGroup / DcsGroup instead.
 */
export interface AvailableDutySlot {
  /** `${scheduleId}:${examRoomId}` */
  slotId: string;
  scheduleId: string;
  examRoomId: string;
  examGroupId: string;
  examType: ExamGroupType;
  semester: number;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  roomNumber: string;
  /** Stable building id — `buildingName` can collide, this cannot. It is the
   *  partition key of the RS grouping algorithm. */
  buildingId: string;
  buildingName: string;
  capacity: number;
  departments: string[];
  flags: RoomDutyFlags;
}

/* -------------------------------------------------------------- rs groups */

/**
 * RS groups are DERIVED client-side, never persisted: available slots are
 * partitioned by (examGroup | schedule | date | start | end | building), sorted
 * by room number and chunked into 5s.
 *
 * `groupId` is `${scheduleId}:${buildingId}:${chunkIndex}` and that exact
 * format must be identical on every RS surface (select-duty, upcoming-duties,
 * change-requests) — the backend stores it verbatim on RS change requests.
 */
export interface RSDutyGroup {
  groupId: string;
  scheduleId: string;
  examGroupId: string;
  examType: ExamGroupType;
  semester: number;
  date: string;
  startTime: string;
  endTime: string;
  buildingId: string;
  buildingName: string;
  chunkIndex: number;
  /** The room+schedule rows that make up the group (size 1–5). */
  rooms: AvailableDutySlot[];
  /** Union of department codes across the group's rooms. */
  departments: string[];
  /** "Rooms 101–107" — first to last room number in numeric order. */
  rangeLabel: string;
  /** True when every room's `rsAssigned` is true (cannot take more RS). */
  allAssigned: boolean;
}

export type RSGroupState =
  | "AVAILABLE" // every room in the chunk is open for RS
  | "SELECTED" // user has this groupId in their selection
  | "FULL" // every room in the chunk already has an RS assigned
  | "CONFLICT"; // time clashes with another selected group / persisted duty

/* ------------------------------------------------------------- dcs groups */

export interface DcsRoomLite {
  _id: string;
  departments: string[];
  room: {
    _id: string;
    roomNumber: string;
    floor: number;
    capacity: number;
    building?: { _id: string; name: string };
  };
}

export interface DcsGroupTeacher {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
}

/** DCS groups, unlike RS ones, are persisted server-side (DCSGroup collection). */
export interface DcsGroup {
  _id: string;
  examGroup: {
    _id: string;
    examType: ExamGroupType;
    semester: number;
    startDate: string;
    endDate: string;
  };
  schedule: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    examGroup: string;
  };
  groupIndex: number;
  dcsRequired: number;
  assignedRooms: DcsRoomLite[];
  assignedDepartments: string[];
  assignedStudents: number;
  assignedTeacher: DcsGroupTeacher | null;
  status: "open" | "claimed" | "released";
  createdAt: string;
  updatedAt: string;
}

export type DcsGroupState =
  | "AVAILABLE" // no assignedTeacher and no time conflict for the viewer
  | "SELECTED" // viewer has this groupId pending in the selection panel
  | "OCCUPIED" // claimed by another DCS
  | "MINE" // claimed by the viewer (context only, not selectable)
  | "CONFLICT"; // time overlaps with another selection or a held duty

/* --------------------------------------------------------- change request */

export type ChangeRequestType = "swap" | "drop";
export type ChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled_exam_deleted";

export interface ChangeRequest {
  _id: string;
  /**
   * Populated only for duty-scope requests. DCS- and RS-scoped requests have
   * `duty: null` — their targets live on the group fields instead. Even for
   * duty-scope requests `exam` may be null, because duties created through the
   * ExamGroup / ExamSchedule / ExamRoom flow carry no legacy Exam document.
   */
  duty: {
    _id: string;
    room: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    teacher: string;
    exam: {
      _id: string;
      name: string;
      department: string;
    } | null;
  } | null;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  type: ChangeRequestType;
  reason: string;
  swapWith: {
    _id: string;
    name: string;
    email: string;
    department: string;
  } | null;
  status: ChangeRequestStatus;
  reviewedBy: {
    _id: string;
    name: string;
    email: string;
  } | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ---------------------------------------------------------- notification */

export type NotificationType =
  | "duty_assigned"
  | "duty_cancelled"
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "duty_swapped"
  | "exam_deleted_duty_release"
  | "duty_reminder"
  | "admin_message";

export interface Notification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  refModel: "Duty" | "ChangeRequest" | null;
  refId: string | null;
  /** Set only on admin_message — the CS who composed the broadcast. */
  sentBy?: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------- envelopes */

export interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}
