export type ChangeRequestType = "swap" | "drop";
export type ChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled_exam_deleted";

export interface ChangeRequest {
  _id: string;
  /**
   * Populated only for duty-scope requests. DCS and RS scoped requests have
   * `duty: null` — their change targets live on `dcsSourceGroup`,
   * `rsSourceDuties`, etc. instead.
   *
   * Even for duty-scope requests, `exam` may be null when the duty was
   * created via the ExamGroup / ExamSchedule / ExamRoom flow — those duties
   * use the new refs and carry no legacy Exam document.
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

export interface CreateChangeRequestPayload {
  duty: string;
  type: ChangeRequestType;
  reason: string;
  swapWith?: string;
}

export interface ReviewPayload {
  id: string;
  note?: string;
}

export interface ChangeRequestListResponse {
  success: boolean;
  count: number;
  data: ChangeRequest[];
}

export interface ChangeRequestResponse {
  success: boolean;
  data: ChangeRequest;
}
