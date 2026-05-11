
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, createUser, updateUser, deleteUser } from "../services";
import { CreateUserRequest, UpdateUserRequest } from "../types";

const USERS_KEY = ["users"];

export const useUsers = () => {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchUsers,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
};
