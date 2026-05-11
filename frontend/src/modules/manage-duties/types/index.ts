import { UserRole } from "@/shared/lib/types";

export interface Teacher {
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

export interface TeacherDuty {
  _id: string;
  exam: {
    _id: string;
    name: string;
    date: string;
    department: string;
    semester: number;
    type: string;
  };
  teacher: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  isSelfAssigned: boolean;
  status: "assigned" | "completed" | "cancelled";
  createdAt: string;
}

export interface TeacherWithStats extends Teacher {
  dutyStats: {
    active: number;
    completed: number;
    total: number;
  };
}

export interface AssignDutyPayload {
  exam: string;
  teacher: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface TeacherFilters {
  search: string;
  department: string;
  role: string;
}
