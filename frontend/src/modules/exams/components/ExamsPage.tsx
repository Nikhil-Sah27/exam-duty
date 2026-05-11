import { useState } from "react";
import { Plus } from "lucide-react";
import { useExamGroups, useCreateExamGroup, useDeleteExamGroup } from "../hooks";
import type { ExamGroup } from "../types";
import ExamGrid from "./ExamGrid";
import ExamFilters from "./ExamFilters";
import CreateExamModal from "./CreateExamModal";
import ConfirmDeleteModal from "@/shared/components/ConfirmDeleteModal";

export default function ExamsPage() {
  const { data: groups, isLoading } = useExamGroups();
  const createMutation = useCreateExamGroup();
  const deleteMutation = useDeleteExamGroup();

  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ExamGroup | null>(null);

  const allGroups = groups || [];

  // Apply client-side filters
  const filtered = allGroups.filter((g) => {
    if (filterType && g.examType !== filterType) return false;
    if (filterSemester && g.semester !== Number(filterSemester)) return false;
    return true;
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage exam groups, schedules, and room assignments.
          </p>
        </div>
        {allGroups.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Exam Group
          </button>
        )}
      </div>

      {/* Filters */}
      {allGroups.length > 0 && (
        <ExamFilters
          selectedType={filterType}
          selectedSemester={filterSemester}
          onTypeChange={setFilterType}
          onSemesterChange={setFilterSemester}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <p className="text-gray-500">Loading exam groups...</p>
      ) : (
        <ExamGrid
          groups={filtered}
          onAddClick={() => setModalOpen(true)}
          onDelete={(group) => setDeleteTarget(group)}
        />
      )}

      {/* Create Modal */}
      <CreateExamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          createMutation.mutate(data, {
            onSuccess: () => setModalOpen(false),
          });
        }}
        isLoading={createMutation.isPending}
        error={createMutation.error}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Exam Group"
        message={
          deleteTarget
            ? `This will permanently delete the ${deleteTarget.examType} Sem ${deleteTarget.semester} exam group and all its schedules and room assignments. This action cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
