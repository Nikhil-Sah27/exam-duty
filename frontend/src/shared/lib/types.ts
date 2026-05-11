export type UserRole = "cs" | "dcs" | "rs" | "invigilator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
