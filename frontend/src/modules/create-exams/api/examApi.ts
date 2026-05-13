import api from "@/shared/lib/api";
import type {
  DepartmentData,
  BuildingGrouped,
  CreatePlanPayload,
  AssignRoomsPayload,
  ApiResponse,
  CreateExamsStatusResponse,
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
