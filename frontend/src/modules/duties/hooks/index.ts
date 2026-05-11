
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDuties,
  selfAssignDuty,
  adminAssignDuty,
  cancelDuty,
} from "../services";
import { SelfAssignRequest, AdminAssignRequest } from "../types";

const DUTIES_KEY = ["duties"];

export const useDuties = () => {
  return useQuery({
    queryKey: DUTIES_KEY,
    queryFn: fetchDuties,
  });
};

export const useSelfAssignDuty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SelfAssignRequest) => selfAssignDuty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DUTIES_KEY });
    },
  });
};

export const useAdminAssignDuty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminAssignRequest) => adminAssignDuty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DUTIES_KEY });
    },
  });
};

export const useCancelDuty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelDuty(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DUTIES_KEY });
    },
  });
};
