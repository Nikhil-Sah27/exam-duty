import api from "@/shared/lib/api";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,
  UserResponse,
  UserProfile,
} from "../types";

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const res = await api.get<UserListResponse>("/users");
  return res.data.data;
};

export const fetchUserById = async (id: string): Promise<UserProfile> => {
  const res = await api.get<UserResponse>(`/users/${id}`);
  return res.data.data;
};

export const createUser = async (data: CreateUserRequest): Promise<UserProfile> => {
  const res = await api.post<UserResponse>("/users", data);
  return res.data.data;
};

export const updateUser = async (
  id: string,
  data: UpdateUserRequest
): Promise<UserProfile> => {
  const res = await api.put<UserResponse>(`/users/${id}`, data);
  return res.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
