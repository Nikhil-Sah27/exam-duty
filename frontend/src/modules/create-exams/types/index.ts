// Re-export department types used across CIE workflow
export type { Department, Semester, Course } from "@/modules/departments/types";

// ---------- Config ----------

export type ExamType = "IA1" | "IA2" | "IA3";

export interface Shift {
  name: string;
  startTime: string;
  endTime: string;
}

export interface CIEConfig {
  departmentIds: string[];
  semester: string;
  examType: ExamType;
  avgStudentsPerClass: number;
  shifts: Shift[];
  startDate: string;
  endDate: string;
}

export interface DateCalculation {
  requiredDays: number;
  maxCourses: number;
  totalSlots: number;
  dates: string[];
  skippedSundays: string[];
  endDate: string | null;
}

// ---------- Departments Data (from API) ----------

export interface DepartmentData {
  _id: string;
  name: string;
  code: string;
  semester: {
    _id: string;
    name: string;
    studentCount: number;
  };
  courses: {
    _id: string;
    name: string;
    code: string;
    credits: number;
  }[];
}

// ---------- Routine ----------

export interface RoutineEntry {
  date: string;
  shiftIndex: number;
  assignments: Record<string, string>; // departmentId → courseId
}

// ---------- Room Assignment ----------

export interface RoomInfo {
  _id: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  buildingName?: string;
}

export interface BuildingGrouped {
  _id: string;
  name: string;
  floors: Record<number, RoomInfo[]>;
}

// ---------- Seat Sharing ----------

/** Tracks a cross-department seat share within a single room */
export interface SharedSeatAllocation {
  roomId: string;
  roomNumber: string;
  roomCapacity: number;
  ownerDeptId: string;
  ownerDeptCode: string;
  targetDeptId: string;
  targetDeptCode: string;
  sharedStudents: number;
}

/** Unused seat info for the suggestion engine */
export interface UnusedSeatInfo {
  roomId: string;
  roomNumber: string;
  roomCapacity: number;
  availableSeats: number;
  ownerDeptId: string;
  ownerDeptCode: string;
  buildingName?: string;
}

/** A single step in a sharing plan */
export interface SeatSharingPlanItem {
  roomId: string;
  roomNumber: string;
  roomCapacity: number;
  ownerDeptId: string;
  ownerDeptCode: string;
  allocate: number;
}

/** Per-department allocation within a slot */
export interface DepartmentAllocation {
  departmentId: string;
  departmentCode: string;
  courseId: string;
  courseName: string;
  students: number;
  assignedRooms: RoomInfo[];
  /** Seats this dept receives from other depts' rooms */
  sharedSeatsReceived: SharedSeatAllocation[];
  /** Seats this dept gives away to other depts from its rooms */
  sharedSeatsGiven: SharedSeatAllocation[];
}

/** A single exam slot with per-department room allocations */
export interface SlotAllocation {
  scheduleId: string;
  date: string;
  shiftIndex: number;
  shiftName: string;
  departments: DepartmentAllocation[];
}

/** Global map tracking which rooms are used per slot key (date_shiftIndex) */
export type UsedRoomsMap = Record<string, string[]>;

/** @deprecated Use SlotAllocation instead */
export interface SlotRoomAssignment {
  scheduleId: string;
  date: string;
  shiftIndex: number;
  shiftName: string;
  totalStudents: number;
  selectedRoomIds: string[];
  selectedCapacity: number;
}

// ---------- API Payloads ----------

export interface CreatePlanPayload {
  examType: ExamType;
  semester: string;
  startDate: string;
  endDate: string;
  shifts: Shift[];
  routine: RoutineEntry[];
}

export interface AssignRoomsPayload {
  assignments: {
    scheduleId: string;
    roomId: string;
    departmentCode: string;
    /** For shared seats: number of students from this dept in this room */
    students?: number;
    isShared?: boolean;
  }[];
}

// ---------- API Responses ----------

export interface CreateExamsStatusResponse {
  success: boolean;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
