// ── Legacy single-exam types (kept for backward compatibility) ──

export interface Exam {
  _id: string;
  name: string;
  date: string;
  department: string;
  semester: number;
  type: ExamType;
  status: ExamStatus;
  isCancelled: boolean;
  cancelledAt: string | null;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export type ExamType = "internal" | "external" | "supplementary" | "arrear";
export type ExamStatus = "upcoming" | "ongoing" | "completed";

// ── New Exam Group types ──

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

export interface ExamSchedule {
  _id: string;
  examGroup: string;
  date: string;
  startTime: string;
  endTime: string;
  rooms: ExamRoomAssignment[];
  createdAt: string;
  updatedAt: string;
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

export interface ExamGroupDetails extends ExamGroup {
  schedules: ExamSchedule[];
}

// ── Duty Status types ──

export interface RoomDutyFlags {
  dcsAssigned: boolean;
  rsAssigned: boolean;
  invigilatorAssigned: boolean;
}

/** Map of examRoomId → duty flags */
export type DutyStatusMap = Record<string, RoomDutyFlags>;

export type DutyStatus = "NOT_ASSIGNED" | "PARTIAL" | "FULLY_ASSIGNED";

export interface DutyStatusResponse {
  success: boolean;
  data: DutyStatusMap;
}

// ── Request types ──

export interface CreateExamGroupRequest {
  examType: ExamGroupType;
  semester: number;
  startDate: string;
  endDate: string;
}

export interface UpdateExamGroupRequest {
  examType?: ExamGroupType;
  semester?: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateScheduleRequest {
  examGroup: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface CreateExamRoomRequest {
  schedule: string;
  room: string;
  departments: string[];
}

// ── Response types ──

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export type ExamGroupListResponse = ListResponse<ExamGroup>;
export type ExamGroupResponse = SingleResponse<ExamGroup>;
export type ExamGroupDetailsResponse = SingleResponse<ExamGroupDetails>;
export type ExamScheduleListResponse = ListResponse<ExamSchedule>;
export type ExamScheduleResponse = SingleResponse<ExamSchedule>;
export type ExamRoomListResponse = ListResponse<ExamRoomAssignment>;
export type ExamRoomResponse = SingleResponse<ExamRoomAssignment>;

// Legacy
export interface CreateExamRequest {
  name: string;
  date: string;
  department: string;
  semester: number;
  type: ExamType;
}

export interface UpdateExamRequest {
  name?: string;
  date?: string;
  department?: string;
  semester?: number;
  type?: ExamType;
  status?: ExamStatus;
}

export interface ExamListResponse {
  success: boolean;
  count: number;
  data: Exam[];
}

export interface ExamResponse {
  success: boolean;
  data: Exam;
}
