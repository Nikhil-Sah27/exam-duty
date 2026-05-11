import { useState } from "react";
import { Plus, Inbox } from "lucide-react";
import { useSemesters, useCreateSemester, useUpdateSemester, useDeleteSemester } from "../hooks";
import { Semester } from "../types";
import SemesterCard from "./SemesterCard";
import SemesterModal from "./SemesterModal";
import { ConfirmDeleteModal } from "@/shared/components";

interface SemesterListProps {
  deptId: string;
}

export default function SemesterList({ deptId }: SemesterListProps) {
  const { data: semesters, isLoading } = useSemesters(deptId);
  const createMutation = useCreateSemester(deptId);
  const updateMutation = useUpdateSemester(deptId);
  const deleteMutation = useDeleteSemester(deptId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<Semester | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteSemester = semesters?.find((s) => s._id === deleteId);

  const handleCreate = (data: { name: string; studentCount: number }) => {
    createMutation.mutate(
      { name: data.name, department: deptId, studentCount: data.studentCount },
      { onSuccess: () => setModalOpen(false) }
    );
  };

  const handleEdit = (semester: Semester) => {
    setEditSemester(semester);
    setModalOpen(true);
  };

  const handleUpdate = (data: { name: string; studentCount: number }) => {
    if (!editSemester) return;
    updateMutation.mutate(
      { id: editSemester._id, data },
      {
        onSuccess: () => {
          setModalOpen(false);
          setEditSemester(null);
        },
      }
    );
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditSemester(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  if (isLoading) return <p className="text-sm text-gray-400">Loading semesters...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Semesters
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Semester
        </button>
      </div>

      {!semesters || semesters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-gray-400 shadow-sm">
          <Inbox className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm">No semesters yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map((s) => (
            <SemesterCard
              key={s._id}
              semester={s}
              deptId={deptId}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <SemesterModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={editSemester ? handleUpdate : handleCreate}
        isLoading={editSemester ? updateMutation.isPending : createMutation.isPending}
        error={editSemester ? updateMutation.error : createMutation.error}
        editSemester={editSemester}
      />

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Semester"
        message={`This will permanently delete "${deleteSemester?.name ?? ""}" and all its courses. This action cannot be undone.`}
      />
    </div>
  );
}
