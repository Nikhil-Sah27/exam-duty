export type UserRole = "cs" | "dcs" | "rs" | "invigilator";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  roles: UserRole[];
  activeRole: UserRole | null;
}
