import { useMemo } from "react";
import type {
  ExamGroup,
  ExamGroupStatus,
  ExamGroupType,
} from "../types/exam.types";
import {
  groupExamsByCategory,
  type CategorizedExams,
} from "../utils/examGroupingUtils";
import { bucketByStatus, STATUS_RENDER_ORDER } from "../utils/examSortUtils";

export interface UseGroupedExamsOptions {
  /** Optional exam-type filter: `""` / undefined = all, otherwise one of IA1|IA2|IA3|SEE. */
  selectedType?: string;
  /** Optional semester filter ("" / undefined = all). */
  selectedSemester?: string | number;
}

export type StatusBuckets = Record<ExamGroupStatus, ExamGroup[]>;

export interface GroupedExams {
  /** Raw category split: { cie: { IA1, IA2, IA3 }, see }. */
  categorized: CategorizedExams;
  /** Per-IA-type status buckets in the canonical Ongoing → Upcoming → Completed order. */
  cieBuckets: Record<Extract<ExamGroupType, "IA1" | "IA2" | "IA3">, StatusBuckets>;
  /** Status buckets for SEE in the same canonical order. */
  seeBuckets: StatusBuckets;
  /** Total exams left after filters (across all sections). */
  total: number;
  /** Section visibility flags driven by the active type filter. */
  showCIE: boolean;
  showSEE: boolean;
  /** Canonical status render order (Ongoing → Upcoming → Completed). */
  statusOrder: ExamGroupStatus[];
}

/**
 * Centralized exam-grouping hook. Used by every view that lists exam groups
 * (CS Exams page, Invigilator/RS Exams, role dashboards). Encapsulates:
 *   • optional client-side type + semester filtering
 *   • CIE vs SEE split (groupByExamType)
 *   • per-IA bucketing into Ongoing / Upcoming / Completed (sortStatus)
 *
 * Pure / memoized — safe to call on every render.
 */
export function useGroupedExams(
  exams: ExamGroup[] | undefined,
  { selectedType = "", selectedSemester = "" }: UseGroupedExamsOptions = {},
): GroupedExams {
  return useMemo(() => {
    const list = exams ?? [];

    const filtered = list.filter((g) => {
      if (selectedType && g.examType !== selectedType) return false;
      if (selectedSemester !== "" && selectedSemester !== undefined) {
        const sem = typeof selectedSemester === "string" ? Number(selectedSemester) : selectedSemester;
        if (!Number.isNaN(sem) && sem !== 0 && g.semester !== sem) return false;
      }
      return true;
    });

    const categorized = groupExamsByCategory(filtered);

    const cieBuckets = {
      IA1: bucketByStatus(categorized.cie.IA1),
      IA2: bucketByStatus(categorized.cie.IA2),
      IA3: bucketByStatus(categorized.cie.IA3),
    };
    const seeBuckets = bucketByStatus(categorized.see);

    const showCIE = selectedType === "" || selectedType.startsWith("IA");
    const showSEE = selectedType === "" || selectedType === "SEE";

    return {
      categorized,
      cieBuckets,
      seeBuckets,
      total: filtered.length,
      showCIE,
      showSEE,
      statusOrder: STATUS_RENDER_ORDER,
    };
  }, [exams, selectedType, selectedSemester]);
}
