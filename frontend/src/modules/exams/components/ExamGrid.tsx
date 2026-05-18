import { Plus } from "lucide-react";
import { ExamGroup } from "../types";
import { getExamGroupStatus } from "@/modules/shared/exams/utils/examStatusUtils";
import { groupExamsByCategory } from "@/modules/shared/exams/utils/examGroupingUtils";
import CIEExamCard from "./CIEExamCard";
import SEEExamCard from "./SEEExamCard";
import ExamCategorySection from "./ExamCategorySection";

interface ExamGridProps {
  groups: ExamGroup[];
  /**
   * Active type filter (`""` = all, otherwise one of `IA1` | `IA2` | `IA3` | `SEE`).
   * Controls which top-level section(s) render.
   */
  selectedType: string;
  onAddClick: () => void;
  onDelete: (group: ExamGroup) => void;
}

// Top-level Exams listing. Owns the CIE vs SEE split, the section-level
// empty states, and the card-variant choice. Internal sorting (status
// priority + nearest date) is delegated to ExamCategorySection /
// ExamStatusGroup so the grid itself stays declarative.
export default function ExamGrid({
  groups,
  selectedType,
  onAddClick,
  onDelete,
}: ExamGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
        <p className="text-sm text-gray-500">No exam groups found</p>
        <button
          onClick={onAddClick}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Create Exam Group
        </button>
      </div>
    );
  }

  const categorized = groupExamsByCategory(groups);

  // Filter routing:
  //   • selectedType === "SEE"  → only SEE section
  //   • selectedType === "IA1"  → only CIE section, with IA2/IA3 buckets emptied
  //   • selectedType === ""     → both sections (default)
  const showCIE = selectedType === "" || selectedType.startsWith("IA");
  const showSEE = selectedType === "" || selectedType === "SEE";

  const filteredCie = selectedType.startsWith("IA")
    ? {
        IA1: selectedType === "IA1" ? categorized.cie.IA1 : [],
        IA2: selectedType === "IA2" ? categorized.cie.IA2 : [],
        IA3: selectedType === "IA3" ? categorized.cie.IA3 : [],
      }
    : categorized.cie;

  return (
    <div className="space-y-10">
      {showCIE && (
        <ExamCategorySection
          variant="cie"
          title="CIE — Internal Exams"
          subtitle="Continuous Internal Evaluation · IA1, IA2, IA3"
          data={{ kind: "cie", groups: filteredCie }}
          renderCard={(g) => (
            <CIEExamCard
              key={g._id}
              group={g}
              status={getExamGroupStatus(g)}
              onDelete={onDelete}
            />
          )}
          emptyMessage={
            selectedType && selectedType.startsWith("IA")
              ? `No ${selectedType} exams available.`
              : "No internal exams available."
          }
        />
      )}

      {showSEE && (
        <ExamCategorySection
          variant="see"
          title="SEE — External Exams"
          subtitle="Semester End Examinations"
          data={{ kind: "see", groups: categorized.see }}
          renderCard={(g) => (
            <SEEExamCard
              key={g._id}
              group={g}
              status={getExamGroupStatus(g)}
              onDelete={onDelete}
            />
          )}
          emptyMessage="No SEE exams scheduled."
        />
      )}
    </div>
  );
}
