import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCreateExamsStatus,
  fetchDepartmentsData,
  fetchCIERooms,
  createCIEPlan,
  assignCIERooms,
  finalizeCIEExam,
} from "../api";
import type {
  CreatePlanPayload,
  AssignRoomsPayload,
  FinalizeCIEPayload,
} from "../types";

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

// Single-call transactional finalize — exam is only created when this fires.
// Invalidates the exam-groups caches so the new exam appears immediately in
// /exams without a manual refresh.
export const useFinalizeCIEExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FinalizeCIEPayload) => finalizeCIEExam(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-groups"] });
      qc.invalidateQueries({ queryKey: ["shared", "exam-groups"] });
    },
  });
};

export { useExamCreation } from "./useExamCreation";
