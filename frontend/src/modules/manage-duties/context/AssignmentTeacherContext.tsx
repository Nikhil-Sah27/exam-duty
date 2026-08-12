import { createContext, useContext, ReactNode } from "react";
import type { Teacher } from "../types";
import type { TeacherDutyProgress } from "@/modules/duty-calculation/types";

/**
 * Carries the "assign duty to this teacher" intent from the CS's teacher
 * profile all the way down to <DutyStatusModal>. When populated, the modal
 * renders the "Assign Duty to {teacher}" CTA on vacant invigilator slots.
 * When null (default), the modal is view-only — same behaviour it had before
 * this workflow existed.
 */
export interface AssignmentTeacherContextValue {
  teacher: Teacher;
  progress: TeacherDutyProgress | null;
}

const Ctx = createContext<AssignmentTeacherContextValue | null>(null);

export function AssignmentTeacherProvider({
  value,
  children,
}: {
  value: AssignmentTeacherContextValue;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssignmentTeacher(): AssignmentTeacherContextValue | null {
  return useContext(Ctx);
}
