
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChangeRequests,
  fetchMyChangeRequests,
  createChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
} from "../services";
import { CreateChangeRequestPayload, ReviewPayload } from "../types";

const CHANGE_REQUESTS_KEY = ["change-requests"];
const MY_CHANGE_REQUESTS_KEY = ["change-requests", "mine"];

export const useChangeRequests = () => {
  return useQuery({
    queryKey: CHANGE_REQUESTS_KEY,
    queryFn: fetchChangeRequests,
  });
};

export const useMyChangeRequests = () => {
  return useQuery({
    queryKey: MY_CHANGE_REQUESTS_KEY,
    queryFn: fetchMyChangeRequests,
  });
};

export const useCreateChangeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChangeRequestPayload) =>
      createChangeRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANGE_REQUESTS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_CHANGE_REQUESTS_KEY });
    },
  });
};

export const useReviewChangeRequest = (action: "approve" | "reject") => {
  const queryClient = useQueryClient();

  const mutationFn =
    action === "approve" ? approveChangeRequest : rejectChangeRequest;

  return useMutation({
    mutationFn: ({ id, note }: ReviewPayload) => mutationFn(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANGE_REQUESTS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_CHANGE_REQUESTS_KEY });
    },
  });
};
