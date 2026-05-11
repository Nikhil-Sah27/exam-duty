import { ExamGroupType } from "../types";

const EXAM_TYPES: ExamGroupType[] = ["IA1", "IA2", "IA3", "SEE"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface ExamFiltersProps {
  selectedType: string;
  selectedSemester: string;
  onTypeChange: (type: string) => void;
  onSemesterChange: (semester: string) => void;
}

export default function ExamFilters({
  selectedType,
  selectedSemester,
  onTypeChange,
  onSemesterChange,
}: ExamFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Exam Type Filter */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onTypeChange("")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedType === ""
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Types
        </button>
        {EXAM_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type === selectedType ? "" : type)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedType === type
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Semester Filter */}
      <select
        value={selectedSemester}
        onChange={(e) => onSemesterChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Semesters</option>
        {SEMESTERS.map((s) => (
          <option key={s} value={s}>
            Semester {s}
          </option>
        ))}
      </select>
    </div>
  );
}
