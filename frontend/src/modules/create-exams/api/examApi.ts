import api from "@/shared/lib/api";
import type {
  DepartmentData,
  BuildingGrouped,
  CreatePlanPayload,
  AssignRoomsPayload,
  FinalizeCIEPayload,
  ApiResponse,
  CreateExamsStatusResponse,
  ReservationInfo,
  ShareableRoomOption,
} from "../types";

export const fetchCreateExamsStatus = async (): Promise<string> => {
  const res = await api.get<CreateExamsStatusResponse>("/create-exams");
  return res.data.message;
};

export const fetchDepartmentsData = async (
  departmentIds: string[],
  semester: string
): Promise<DepartmentData[]> => {
  const res = await api.get<ApiResponse<DepartmentData[]>>(
    "/create-exams/cie/departments-data",
    { params: { departmentIds: departmentIds.join(","), semester } }
  );
  return res.data.data;
};

export const fetchCIERooms = async (): Promise<BuildingGrouped[]> => {
  const res = await api.get<ApiResponse<BuildingGrouped[]>>(
    "/create-exams/cie/rooms"
  );
  return res.data.data;
};

export const createCIEPlan = async (
  payload: CreatePlanPayload
): Promise<unknown> => {
  const res = await api.post<ApiResponse<unknown>>(
    "/create-exams/cie/plan",
    payload
  );
  return res.data.data;
};

export const assignCIERooms = async (
  payload: AssignRoomsPayload
): Promise<unknown> => {
  const res = await api.post<ApiResponse<unknown>>(
    "/create-exams/cie/assign-rooms",
    payload
  );
  return res.data.data;
};

// Single-call transactional finalize. Nothing is persisted before this fires.
export const finalizeCIEExam = async (
  payload: FinalizeCIEPayload,
): Promise<unknown> => {
  const res = await api.post<ApiResponse<unknown>>(
    "/create-exams/cie/finalize",
    payload,
  );
  return res.data.data;
};

/**
 * Bulk look-up: for each `{date, startTime, endTime}` slot, ask the backend
 * which rooms are already reserved in overlapping time windows across ALL
 * exams. `excludeExamGroupId` lets an edit flow ignore its own reservations.
 */
export const fetchRoomAvailability = async (
  slots: { date: string; startTime: string; endTime: string }[],
  excludeExamGroupId?: string | null,
): Promise<Record<string, ReservationInfo[]>> => {
  const res = await api.post<ApiResponse<Record<string, ReservationInfo[]>>>(
    "/exam-groups/room-availability",
    { slots, excludeExamGroupId: excludeExamGroupId || null },
  );
  return res.data.data;
};

/**
 * Global Seat Sharing discovery: for each `{date, startTime, endTime}` slot,
 * return every ExamRoom marked shareable whose owner schedule overlaps that
 * slot. Response is keyed by `${date}|${startTime}|${endTime}`.
 */
export const fetchShareableRoomsForSlots = async (
  slots: { date: string; startTime: string; endTime: string }[],
  excludeExamGroupId?: string | null,
): Promise<Record<string, ShareableRoomOption[]>> => {
  const res = await api.post<ApiResponse<Record<string, ShareableRoomOption[]>>>(
    "/seat-sharing/available",
    { slots, excludeExamGroupId: excludeExamGroupId || null },
  );
  return res.data.data;
};
