import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchDepartmentStats,
  fetchSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../services";
import { CreateDepartmentPayload, CreateSemesterPayload, CreateCoursePayload } from "../types";

const DEPTS_KEY = ["departments"];
const deptStatsKey = (id: string) => ["departments", id, "stats"];
const semestersKey = (deptId: string) => ["departments", deptId, "semesters"];
const coursesKey = (semId: string) => ["semesters", semId, "courses"];

// ---------- Department ----------

export const useDepartments = () =>
  useQuery({ queryKey: DEPTS_KEY, queryFn: fetchDepartments });

export const useDepartmentStats = (id: string) =>
  useQuery({
    queryKey: deptStatsKey(id),
    queryFn: () => fetchDepartmentStats(id),
    enabled: !!id,
  });

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentPayload) => createDepartment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDepartmentPayload> }) =>
      updateDepartment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
};

export const useDeleteDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
};

// ---------- Semester ----------

export const useSemesters = (deptId: string) =>
  useQuery({
    queryKey: semestersKey(deptId),
    queryFn: () => fetchSemesters(deptId),
    enabled: !!deptId,
  });

export const useCreateSemester = (deptId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSemesterPayload) => createSemester(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: semestersKey(deptId) });
      qc.invalidateQueries({ queryKey: deptStatsKey(deptId) });
    },
  });
};

export const useUpdateSemester = (deptId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSemesterPayload> }) =>
      updateSemester(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: semestersKey(deptId) });
      qc.invalidateQueries({ queryKey: deptStatsKey(deptId) });
    },
  });
};

export const useDeleteSemester = (deptId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSemester(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: semestersKey(deptId) });
      qc.invalidateQueries({ queryKey: deptStatsKey(deptId) });
    },
  });
};

// ---------- Course ----------

export const useCourses = (semesterId: string) =>
  useQuery({
    queryKey: coursesKey(semesterId),
    queryFn: () => fetchCourses(semesterId),
    enabled: !!semesterId,
  });

export const useCreateCourse = (semesterId: string, deptId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoursePayload) => createCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coursesKey(semesterId) });
      qc.invalidateQueries({ queryKey: deptStatsKey(deptId) });
    },
  });
};

export const useUpdateCourse = (semesterId: string, deptId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCoursePayload> }) =>
      updateCourse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coursesKey(semesterId) });
      qc.invalidateQueries({ queryKey: deptStatsKey(deptId) });
    },
  });
};

export const useDeleteCourse = (semesterId: string, deptId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coursesKey(semesterId) });
      qc.invalidateQueries({ queryKey: deptStatsKey(deptId) });
    },
  });
};
