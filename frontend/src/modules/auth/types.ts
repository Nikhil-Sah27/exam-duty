export type { User } from "@/shared/lib/types";
import type { User, UserRole } from "@/shared/lib/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  designation?: string;
  roles?: UserRole[];
}

// Backend login/register response.
// - Single-role user: token is set, tempToken is null.
// - Multi-role user: tempToken is set, token is null, requiresRoleSelection = true.
export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string | null;
    tempToken?: string | null;
    requiresRoleSelection?: boolean;
  };
}

export interface SelectRoleResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}
