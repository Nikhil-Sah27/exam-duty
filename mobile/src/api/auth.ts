import api from "@/api/client";
import type {
  AuthResponse,
  LoginRequest,
  SelectRoleResponse,
  User,
  UserRole,
} from "@/shared/types";

/** Mirror of frontend/src/modules/auth/services/index.ts (login paths only —
 *  registration is a CS-side flow with no mobile surface). */

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
};

export const selectRole = async (
  role: UserRole
): Promise<SelectRoleResponse> => {
  const res = await api.post<SelectRoleResponse>("/auth/select-role", { role });
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get<{ success: boolean; data: User }>("/auth/me");
  return res.data.data;
};
