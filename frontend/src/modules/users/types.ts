import { UserRole } from "@/shared/lib/types";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  department: string | null;
  designation: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  department?: string;
  designation?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
}

export interface UserListResponse {
  success: boolean;
  count: number;
  data: UserProfile[];
}

export interface UserResponse {
  success: boolean;
  data: UserProfile;
}
