import api from "@/shared/lib/api";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "../types";

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
};

export const registerUser = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get<{ success: boolean; data: User }>("/auth/me");
  return res.data.data;
};
