export type DutyStatus = "assigned" | "completed" | "cancelled";

export interface Duty {
  _id: string;
  exam: {
    _id: string;
    name: string;
    date: string;
    department: string;
    semester: number;
    type: string;
  };
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

export interface SelfAssignRequest {
  exam: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AdminAssignRequest extends SelfAssignRequest {
  teacher: string;
}

export interface CancelDutyRequest {
  reason?: string;
}

export interface DutyListResponse {
  success: boolean;
  count: number;
  data: Duty[];
}

export interface DutyResponse {
  success: boolean;
  data: Duty;
}
