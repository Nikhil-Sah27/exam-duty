import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTeachers,
  getTeacherById,
  getTeacherDuties,
  assignDuty,
} from "../services";
import { AssignDutyPayload } from "../types";

const TEACHERS_KEY = ["manage-duties", "teachers"];
const teacherDetailKey = (id: string) => ["manage-duties", "teacher", id];
const teacherDutiesKey = (id: string) => ["manage-duties", "duties", id];

export const useTeachers = () => {
  return useQuery({
    queryKey: TEACHERS_KEY,
    queryFn: getTeachers,
  });
};

export const useTeacherDetails = (id: string) => {
  return useQuery({
    queryKey: teacherDetailKey(id),
    queryFn: () => getTeacherById(id),
    enabled: !!id,
  });
};

export const useTeacherDuties = (teacherId: string) => {
  return useQuery({
    queryKey: teacherDutiesKey(teacherId),
    queryFn: () => getTeacherDuties(teacherId),
    enabled: !!teacherId,
  });
};

export const useAssignDuty = (teacherId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignDutyPayload) => assignDuty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherDutiesKey(teacherId) });
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["duties"] });
    },
  });
};
