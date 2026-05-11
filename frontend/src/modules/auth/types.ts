export type { User } from "@/shared/lib/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: "cs" | "dcs" | "rs" | "invigilator";
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: import("@/shared/lib/types").User;
    token: string;
  };
}
