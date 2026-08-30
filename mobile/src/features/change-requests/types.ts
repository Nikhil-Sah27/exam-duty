import type { ExamGroupType, UserRole } from "@/shared/types";

/**
 * Change-request shapes as the backend actually populates them. Mobile port of
 * frontend/src/modules/shared/change-requests/types/changeRequest.types.ts —
 * keep in sync with that file and with
 * backend/modules/change-request/changeRequest.repository.js (POPULATE_DEEP),
 * which decides which of these refs come back hydrated.
 *
 * This is the app's only change-request type. `src/shared/types.ts` used to
 * carry a second, narrower copy (swap/drop only, no `scope`) that nothing
 * imported; it has been deleted rather than left to drift further apart.
 */

export type ChangeRequestScope = "duty" | "dcs_group" | "rs_group";

export type ChangeRequestType =
  | "swap"
  | "drop"
  | "move"
  | "dcs_swap"
  | "rs_swap";

export type ChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled_exam_deleted";

export interface ChangeRequestUser {
  _id: string;
  name: string;
  email: string;
  department?: string;
}

export interface ChangeRequestDuty {
  _id: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  teacher?: string;
  exam?: {
    _id: string;
    name: string;
    department?: string;
  } | null;
}

export interface RequestedScheduleRef {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  examGroup?: {
    _id: string;
    examType: string;
    semester: number;
  };
}

interface RoomRef {
  _id: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  building?: { _id: string; name: string };
}

export interface RequestedExamRoomRef {
  _id: string;
  departments: string[];
  room?: RoomRef;
}

/** Populated DCSGroup as it appears on a populated ChangeRequest. */
export interface DcsGroupRef {
  _id: string;
  groupIndex: number;
  dcsRequired: number;
  status: "open" | "claimed" | "released";
  assignedDepartments: string[];
  assignedStudents: number;
  examGroup: {
    _id: string;
    examType: string;
    semester: number;
  } | null;
  schedule: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  assignedRooms: Array<{
    _id: string;
    departments: string[];
    room: RoomRef;
  }>;
  assignedTeacher: {
    _id: string;
    name: string;
    email: string;
    phone?: string | null;
    department?: string | null;
  } | null;
}

/** Populated Duty on the source side of an RS group swap. */
export interface RsSourceDutyRef {
  _id: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
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
    room?: RoomRef;
  } | null;
}

/** Populated ExamRoom on the target side of an RS group swap. */
export interface RsTargetExamRoomRef {
  _id: string;
  departments: string[];
  room?: RoomRef;
  schedule?: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    examGroup?: {
      _id: string;
      examType: string;
      semester: number;
    };
  };
}

export interface ChangeRequest {
  _id: string;
  scope?: ChangeRequestScope;
  /** Non-null for duty-scope requests only; group swaps carry null. */
  duty: ChangeRequestDuty | null;
  requestedBy: ChangeRequestUser;
  type: ChangeRequestType;
  reason: string;
  swapWith: ChangeRequestUser | null;
  /** Populated only when type === "move". */
  requestedSchedule: RequestedScheduleRef | null;
  requestedExamRoom: RequestedExamRoomRef | null;
  requestedRoom: string | null;
  requestedDate: string | null;
  requestedStartTime: string | null;
  requestedEndTime: string | null;
  /** Populated only when type === "dcs_swap". */
  dcsSourceGroup: DcsGroupRef | null;
  dcsTargetGroup: DcsGroupRef | null;
  /**
   * Populated only when type === "rs_swap". RS groups have no server-side
   * identity, so the source side is a snapshot of the duties the requester
   * holds and the target side the examRooms they want; the two keys are the
   * `${scheduleId}:${buildingId}:${chunkIndex}` group ids.
   */
  rsSourceDuties?: RsSourceDutyRef[];
  rsTargetExamRooms?: RsTargetExamRoomRef[];
  rsSourceKey?: string | null;
  rsTargetKey?: string | null;
  status: ChangeRequestStatus;
  reviewedBy: { _id: string; name: string; email: string } | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeRequestPayload {
  /** Duty-scoped requests only. */
  duty?: string;
  type: ChangeRequestType;
  reason: string;
  /** type === "swap" — the teacher willing to take over. */
  swapWith?: string;
  /** type === "move" — the target slot. */
  requestedSchedule?: string;
  requestedExamRoom?: string;
  /** type === "dcs_swap". */
  dcsSourceGroup?: string;
  dcsTargetGroup?: string;
  /** type === "rs_swap". */
  rsSourceDuties?: string[];
  rsTargetExamRooms?: string[];
  rsSourceKey?: string;
  rsTargetKey?: string;
}

/** A vacant slot from GET /change-requests/replacements/:dutyId. */
export interface ReplacementSlot {
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
  floor: number;
  capacity: number;
  buildingName?: string;
  departments: string[];
}

/** A teacher who could take over an invigilator duty (GET /users). */
export interface SwapCandidate {
  _id: string;
  name: string;
  email: string;
  department?: string | null;
  designation?: string | null;
  roles: UserRole[];
  isActive: boolean;
}
