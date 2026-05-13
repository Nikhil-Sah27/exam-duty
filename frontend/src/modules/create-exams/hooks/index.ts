import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchCreateExamsStatus,
  fetchDepartmentsData,
  fetchCIERooms,
  createCIEPlan,
  assignCIERooms,
} from "../api";
import type { CreatePlanPayload, AssignRoomsPayload } from "../types";

const CREATE_EXAMS_KEY = ["create-exams"];
const CIE_ROOMS_KEY = ["cie-rooms"];

export const useCreateExamsStatus = () =>
  useQuery({ queryKey: CREATE_EXAMS_KEY, queryFn: fetchCreateExamsStatus });

export const useDepartmentsData = (departmentIds: string[], semester: string) =>
  useQuery({
    queryKey: ["cie-departments-data", departmentIds, semester],
    queryFn: () => fetchDepartmentsData(departmentIds, semester),
    enabled: departmentIds.length > 0 && semester !== "",
  });

export const useCIERooms = () =>
  useQuery({ queryKey: CIE_ROOMS_KEY, queryFn: fetchCIERooms });

export const useCreateCIEPlan = () =>
  useMutation({ mutationFn: (data: CreatePlanPayload) => createCIEPlan(data) });

export const useAssignCIERooms = () =>
  useMutation({ mutationFn: (data: AssignRoomsPayload) => assignCIERooms(data) });

export { useExamCreation } from "./useExamCreation";
