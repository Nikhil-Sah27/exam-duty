import api from "@/shared/lib/api";
import type {
  DepartmentData,
  ApiResponse,
} from "../../types";
import type {
  SEEPlanPayload,
  SEEPlanResponse,
  FinalizeSEEPayload,
} from "../types";

/**
 * Reuse the CIE departments-data endpoint — it already supports a comma-
 * separated department-id list and returns courses for the matching semester.
 * The SEE flow just calls it with a single department id.
 */
export const fetchSEEDepartmentData = async (
  departmentId: string,
  semester: string,
): Promise<DepartmentData | null> => {
  if (!departmentId || !semester) return null;
  const res = await api.get<ApiResponse<DepartmentData[]>>(
    "/create-exams/cie/departments-data",
    { params: { departmentIds: departmentId, semester } },
  );
  return res.data.data[0] ?? null;
};

export const createSEEPlan = async (
  payload: SEEPlanPayload,
): Promise<SEEPlanResponse> => {
  const res = await api.post<ApiResponse<SEEPlanResponse>>(
    "/create-exams/see/plan",
    payload,
  );
  return res.data.data;
};

// Single-call transactional finalize. Nothing is persisted before this fires.
export const finalizeSEEExam = async (
  payload: FinalizeSEEPayload,
): Promise<unknown> => {
  const res = await api.post<ApiResponse<unknown>>(
    "/create-exams/see/finalize",
    payload,
  );
  return res.data.data;
};
