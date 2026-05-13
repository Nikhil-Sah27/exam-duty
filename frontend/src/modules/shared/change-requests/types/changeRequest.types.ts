export type ChangeRequestType = "swap" | "drop" | "move";
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

export interface ChangeRequest {
  _id: string;
  duty: ChangeRequestDuty;
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
  status: ChangeRequestStatus;
  reviewedBy: { _id: string; name: string; email: string } | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeRequestPayload {
  duty: string;
  type: ChangeRequestType;
  reason: string;
  /** For "swap" requests. */
  swapWith?: string;
  /** For "move" requests — the target schedule + examRoom IDs. */
  requestedSchedule?: string;
  requestedExamRoom?: string;
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
