import { useState } from "react";
import type {
  ExamGroup,
  ExamGroupStatus,
} from "@/modules/shared/exams/types/exam.types";
import { getExamGroupStatus } from "@/modules/shared/exams/utils/examStatusUtils";
import ExamFilters from "@/modules/exams/components/ExamFilters";
import { useInvigilatorExamView } from "../hooks/useInvigilatorExams";
import InvigilatorExamCard from "../components/InvigilatorExamCard";

const STATUS_PRIORITY: Record<ExamGroupStatus, number> = {
  upcoming: 0,
  ongoing: 1,
  completed: 2,
};

function sortByStatusThenDate(groups: ExamGroup[]): ExamGroup[] {
  return [...groups].sort((a, b) => {
    const sa = getExamGroupStatus(a);
    const sb = getExamGroupStatus(b);
    const diff = STATUS_PRIORITY[sa] - STATUS_PRIORITY[sb];
    if (diff !== 0) return diff;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
}

export default function InvigilatorExamsPage() {
  const { data: groups, isLoading, error } = useInvigilatorExamView();
  const [filterType, setFilterType] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  const allGroups = groups || [];
  const filtered = allGroups.filter((g) => {
    if (filterType && g.examType !== filterType) return false;
    if (filterSemester && g.semester !== Number(filterSemester)) return false;
    return true;
  });
  const sorted = sortByStatusThenDate(filtered);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upcoming and ongoing exams. Open any group to see its schedule and rooms.
        </p>
      </div>

      {allGroups.length > 0 && (
        <ExamFilters
          selectedType={filterType}
          selectedSemester={filterSemester}
          onTypeChange={setFilterType}
          onSemesterChange={setFilterSemester}
        />
      )}

      {isLoading && <p className="text-sm text-gray-500">Loading exams...</p>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load exams. Please try again later.
        </div>
      )}

      {!isLoading && allGroups.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-500">No upcoming exams have been created yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Exams created by the controller will appear here automatically.
          </p>
        </div>
      )}

      {!isLoading && allGroups.length > 0 && sorted.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-500">No exams match the current filters.</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((g) => (
            <InvigilatorExamCard
              key={g._id}
              group={g}
              status={getExamGroupStatus(g)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
