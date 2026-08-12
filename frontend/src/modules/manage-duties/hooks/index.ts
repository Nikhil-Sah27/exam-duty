import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTeachers,
  getTeacherById,
  getTeacherDuties,
  assignDutyBySlot,
  type AssignByScheduleSlotPayload,
} from "../services";
import { DUTY_CALC_ROOT } from "@/modules/duty-calculation/hooks/useDutyProgress";

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

/**
 * Mutation for the visual CS workflow — takes an ExamSchedule + ExamRoom
 * pair. Invalidates duty caches, exam-group duty-status maps (so the room
 * dot flips from red to green immediately), and duty-calculation progress
 * (so the teacher's Assigned/Remaining tiles refresh).
 */
export const useAssignDutyBySlot = (teacherId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignByScheduleSlotPayload) => assignDutyBySlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherDutiesKey(teacherId) });
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["exam-groups"] });
      queryClient.invalidateQueries({ queryKey: DUTY_CALC_ROOT });
    },
  });
};
