import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllTeachersProgress,
  fetchInstitutionDutySummary,
  fetchMyDutyProgress,
  fetchTeacherDutyProgress,
  type AllTeachersFilters,
} from "../services/dutyCalculationApi";

/**
 * Central query keys for the duty-calculation module. Grouped under a single
 * root so cross-cutting mutations (teacher CRUD, exam creation, etc.) can
 * invalidate every derived read with one `invalidateQueries({ queryKey:
 * DUTY_CALC_ROOT })`.
 */
export const DUTY_CALC_ROOT = ["duty-calculation"] as const;

export const DUTY_CALC_KEYS = {
  root: DUTY_CALC_ROOT,
  myProgress: [...DUTY_CALC_ROOT, "my-progress"] as const,
  teacherProgress: (id: string) =>
    [...DUTY_CALC_ROOT, "teacher-progress", id] as const,
  allTeachers: (filters: AllTeachersFilters) =>
    [...DUTY_CALC_ROOT, "all-teachers", filters] as const,
  institution: [...DUTY_CALC_ROOT, "institution"] as const,
};

/** Widget hook for the invigilator dashboard. */
export function useMyDutyProgress() {
  return useQuery({
    queryKey: DUTY_CALC_KEYS.myProgress,
    queryFn: fetchMyDutyProgress,
    staleTime: 30_000,
  });
}

export function useTeacherDutyProgress(teacherId: string | null | undefined) {
  return useQuery({
    queryKey: DUTY_CALC_KEYS.teacherProgress((teacherId as string) || ""),
    queryFn: () => fetchTeacherDutyProgress(teacherId as string),
    enabled: Boolean(teacherId),
    staleTime: 30_000,
  });
}

export function useAllTeachersProgress(filters: AllTeachersFilters = {}) {
  return useQuery({
    queryKey: DUTY_CALC_KEYS.allTeachers(filters),
    queryFn: () => fetchAllTeachersProgress(filters),
    staleTime: 30_000,
  });
}

export function useInstitutionDutySummary() {
  return useQuery({
    queryKey: DUTY_CALC_KEYS.institution,
    queryFn: fetchInstitutionDutySummary,
    staleTime: 30_000,
  });
}

/**
 * Convenience helper — call this from any mutation that changes teacher,
 * course, semester, department, exam, or duty state so every derived widget
 * refetches on the next render. Idempotent; safe to call multiple times.
 */
export function useInvalidateDutyCalculation() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: DUTY_CALC_ROOT });
}
