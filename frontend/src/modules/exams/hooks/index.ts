import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchExams,
  createExam,
  updateExam,
  cancelExam,
  restoreExam,
  fetchExamGroups,
  fetchExamGroupDetails,
  createExamGroup,
  updateExamGroup,
  deleteExamGroup,
  createSchedule,
  deleteSchedule,
  addExamRoom,
  removeExamRoom,
  fetchExamDutyStatus,
} from "../services";
import {
  CreateExamRequest,
  UpdateExamRequest,
  CreateExamGroupRequest,
  UpdateExamGroupRequest,
  CreateScheduleRequest,
  CreateExamRoomRequest,
} from "../types";

// ── Legacy hooks ──

const EXAMS_KEY = ["exams"];

export const useExams = () => {
  return useQuery({
    queryKey: EXAMS_KEY,
    queryFn: fetchExams,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExamRequest) => createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExamRequest }) =>
      updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
    },
  });
};

export const useCancelExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
    },
  });
};

export const useRestoreExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
    },
  });
};

// ── Exam Group hooks ──

const EXAM_GROUPS_KEY = ["exam-groups"];
const examGroupDetailsKey = (id: string) => ["exam-groups", id, "details"];

export const useExamGroups = () => {
  return useQuery({
    queryKey: EXAM_GROUPS_KEY,
    queryFn: fetchExamGroups,
  });
};

export const useExamGroupDetails = (id: string) => {
  return useQuery({
    queryKey: examGroupDetailsKey(id),
    queryFn: () => fetchExamGroupDetails(id),
    enabled: !!id,
  });
};

export const useCreateExamGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExamGroupRequest) => createExamGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAM_GROUPS_KEY });
    },
  });
};

export const useUpdateExamGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateExamGroupRequest;
    }) => updateExamGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAM_GROUPS_KEY });
    },
  });
};

export const useDeleteExamGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExamGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAM_GROUPS_KEY });
    },
  });
};

// ── Schedule hooks ──

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => createSchedule(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: examGroupDetailsKey(variables.examGroup),
      });
      queryClient.invalidateQueries({ queryKey: EXAM_GROUPS_KEY });
    },
  });
};

export const useDeleteSchedule = (examGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: examGroupDetailsKey(examGroupId),
      });
      queryClient.invalidateQueries({ queryKey: EXAM_GROUPS_KEY });
    },
  });
};

// ── Duty Status hooks ──

const dutyStatusKey = (id: string) => ["exam-groups", id, "duty-status"];

export const useExamDutyStatus = (groupId: string) => {
  return useQuery({
    queryKey: dutyStatusKey(groupId),
    queryFn: () => fetchExamDutyStatus(groupId),
    enabled: !!groupId,
  });
};

// ── Exam Room hooks ──

export const useAddExamRoom = (examGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExamRoomRequest) => addExamRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: examGroupDetailsKey(examGroupId),
      });
      queryClient.invalidateQueries({ queryKey: EXAM_GROUPS_KEY });
    },
  });
};

export const useRemoveExamRoom = (examGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeExamRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: examGroupDetailsKey(examGroupId),
      });
      queryClient.invalidateQueries({ queryKey: EXAM_GROUPS_KEY });
    },
  });
};
