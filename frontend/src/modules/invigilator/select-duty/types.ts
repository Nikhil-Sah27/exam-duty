/**
 * The slot shape used by Select Duty is the same `AvailableDutySlot` produced
 * by the shared selectors layer. We re-export it as `DutySlot` so this module's
 * code reads naturally without leaking the shared name everywhere, while
 * keeping a single source of truth for the shape.
 */
export type { AvailableDutySlot as DutySlot } from "@/modules/shared/exams/selectors/examSelectors";

export type SlotState = "AVAILABLE" | "FULL" | "SELECTED";

export interface DutyFilters {
  date: string;
  examType: string;
  department: string;
  semester: string;
}

export const EMPTY_FILTERS: DutyFilters = {
  date: "",
  examType: "",
  department: "",
  semester: "",
};

export interface SelectionValidation {
  ok: boolean;
  reason?: string;
}
