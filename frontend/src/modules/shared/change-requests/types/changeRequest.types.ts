export type ChangeRequestType = "swap" | "drop" | "move" | "dcs_swap";
export type ChangeRequestScope = "duty" | "dcs_group";
export type ChangeRequestStatus = "pending" | "approved" | "rejected";

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
  };
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

export interface RequestedExamRoomRef {
  _id: string;
  departments: string[];
  room?: {
    _id: string;
    roomNumber: string;
    floor: number;
    capacity: number;
    building?: { _id: string; name: string };
  };
}

/**
 * Populated DCSGroup as it appears on a populated ChangeRequest. Matches the
 * shape produced by changeRequest.repository.DCS_GROUP_POPULATE — schedule,
 * assigned rooms (with building info), departments, and exam-group meta.
 */
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
    room: {
      _id: string;
      roomNumber: string;
      floor: number;
      capacity: number;
      building?: { _id: string; name: string };
    };
  }>;
  assignedTeacher: {
    _id: string;
    name: string;
    email: string;
    phone?: string | null;
    department?: string | null;
  } | null;
}

export interface ChangeRequest {
  _id: string;
  scope?: ChangeRequestScope;
  /** Non-null for per-duty (invigilator) requests. Null for DCS group swaps. */
  duty: ChangeRequestDuty | null;
  requestedBy: ChangeRequestUser;
  type: ChangeRequestType;
  reason: string;
  swapWith: ChangeRequestUser | null;
  /** Move-request target — populated only when type === "move". */
  requestedSchedule: RequestedScheduleRef | null;
  requestedExamRoom: RequestedExamRoomRef | null;
  requestedRoom: string | null;
  requestedDate: string | null;
  requestedStartTime: string | null;
  requestedEndTime: string | null;
  /** DCS scope — populated only when type === "dcs_swap". */
  dcsSourceGroup: DcsGroupRef | null;
  dcsTargetGroup: DcsGroupRef | null;
  status: ChangeRequestStatus;
  reviewedBy: { _id: string; name: string; email: string } | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeRequestPayload {
  /** Duty-scoped requests. Omit for "dcs_swap". */
  duty?: string;
  type: ChangeRequestType;
  reason: string;
  /** For "swap" requests. */
  swapWith?: string;
  /** For "move" requests — the target schedule + examRoom IDs. */
  requestedSchedule?: string;
  requestedExamRoom?: string;
  /** For "dcs_swap" requests — source/target DCSGroup IDs. */
  dcsSourceGroup?: string;
  dcsTargetGroup?: string;
}

/** A replacement slot returned by GET /change-requests/replacements/:dutyId. */
export interface ReplacementSlot {
  scheduleId: string;
  examRoomId: string;
  examGroupId: string;
  examType: string;
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
