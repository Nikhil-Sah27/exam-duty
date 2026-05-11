import api from "@/shared/lib/api";
import {
  Department,
  DepartmentStats,
  Semester,
  Course,
  CreateDepartmentPayload,
  CreateSemesterPayload,
  CreateCoursePayload,
  DepartmentListResponse,
  DepartmentResponse,
  DepartmentStatsResponse,
  SemesterListResponse,
  SemesterResponse,
  CourseListResponse,
  CourseResponse,
} from "../types";

// ---------- Department ----------

export const fetchDepartments = async (): Promise<Department[]> => {
  const res = await api.get<DepartmentListResponse>("/departments");
  return res.data.data;
};

export const createDepartment = async (data: CreateDepartmentPayload): Promise<Department> => {
  const res = await api.post<DepartmentResponse>("/departments", data);
  return res.data.data;
};

export const updateDepartment = async (id: string, data: Partial<CreateDepartmentPayload>): Promise<Department> => {
  const res = await api.patch<DepartmentResponse>(`/departments/${id}`, data);
  return res.data.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/departments/${id}`);
};

export const fetchDepartmentStats = async (id: string): Promise<DepartmentStats> => {
  const res = await api.get<DepartmentStatsResponse>(`/departments/${id}/stats`);
  return res.data.data;
};

// ---------- Semester ----------

export const fetchSemesters = async (departmentId: string): Promise<Semester[]> => {
  const res = await api.get<SemesterListResponse>(`/departments/${departmentId}/semesters`);
  return res.data.data;
};

export const createSemester = async (data: CreateSemesterPayload): Promise<Semester> => {
  const res = await api.post<SemesterResponse>("/departments/semesters", data);
  return res.data.data;
};

export const updateSemester = async (id: string, data: Partial<CreateSemesterPayload>): Promise<Semester> => {
  const res = await api.patch<SemesterResponse>(`/departments/semesters/${id}`, data);
  return res.data.data;
};

export const deleteSemester = async (id: string): Promise<void> => {
  await api.delete(`/departments/semesters/${id}`);
};

// ---------- Course ----------

export const fetchCourses = async (semesterId: string): Promise<Course[]> => {
  const res = await api.get<CourseListResponse>(`/departments/semesters/${semesterId}/courses`);
  return res.data.data;
};

export const createCourse = async (data: CreateCoursePayload): Promise<Course> => {
  const res = await api.post<CourseResponse>("/departments/courses", data);
  return res.data.data;
};

export const updateCourse = async (id: string, data: Partial<CreateCoursePayload>): Promise<Course> => {
  const res = await api.patch<CourseResponse>(`/departments/courses/${id}`, data);
  return res.data.data;
};

export const deleteCourse = async (id: string): Promise<void> => {
  await api.delete(`/departments/courses/${id}`);
};
