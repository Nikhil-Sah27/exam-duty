import { useEffect, useState } from "react";
import { Plus, Inbox, ChevronDown } from "lucide-react";
import {
  useSemesters,
  useCreateSemester,
  useUpdateSemester,
  useDeleteSemester,
} from "../hooks";
import { Semester } from "../types";
import SemesterCard from "./SemesterCard";
import SemesterModal from "./SemesterModal";
import CourseList from "./CourseList";
import { ConfirmDeleteModal } from "@/shared/components";

interface SemesterListProps {
  deptId: string;
}

// Master-detail layout: a grid of compact semester tiles, with the selected
// tile's course list rendered in a single panel below. Auto-selects the first
// semester on load so the courses panel is never empty when data exists.
export default function SemesterList({ deptId }: SemesterListProps) {
  const { data: semesters, isLoading } = useSemesters(deptId);
  const createMutation = useCreateSemester(deptId);
  const updateMutation = useUpdateSemester(deptId);
  const deleteMutation = useDeleteSemester(deptId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<Semester | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select the first semester whenever the list loads or changes.
  // Sorted by numeric name so "1" comes before "10" if a college ever
  // adopts trimesters or similar.
  const sorted = (semesters ?? [])
    .slice()
    .sort((a, b) => {
      const na = Number(a.name);
      const nb = Number(b.name);
      if (Number.isNaN(na) || Number.isNaN(nb)) return a.name.localeCompare(b.name);
      return na - nb;
    });

  useEffect(() => {
    if (selectedId && sorted.find((s) => s._id === selectedId)) return;
    setSelectedId(sorted[0]?._id ?? null);
  }, [sorted, selectedId]);

  const selected = sorted.find((s) => s._id === selectedId) ?? null;
  const deleteSemester = sorted.find((s) => s._id === deleteId);

  const handleCreate = (data: { name: string; studentCount: number }) => {
    createMutation.mutate(
      { name: data.name, department: deptId, studentCount: data.studentCount },
      { onSuccess: () => setModalOpen(false) },
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
      },
    );
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditSemester(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        if (selectedId === deleteId) setSelectedId(null);
      },
    });
  };

  if (isLoading) return <p className="text-sm text-gray-400">Loading semesters...</p>;

  return (
    <div className="space-y-5">
      {/* Section heading + action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Semesters
          </h3>
          {selected && (
            <p className="mt-0.5 text-xs text-gray-400">
              Click a semester to view its courses
            </p>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Semester
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-gray-400">
          <Inbox className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm">No semesters yet</p>
        </div>
      ) : (
        <>
          {/* Tile grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((s) => (
              <SemesterCard
                key={s._id}
                semester={s}
                selected={selectedId === s._id}
                onSelect={setSelectedId}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>

          {/* Master-detail panel for the selected semester */}
          {selected && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
                <ChevronDown className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-gray-800">
                  Semester {selected.name}{" "}
                  <span className="font-normal text-gray-400">· Courses</span>
                </h4>
              </div>
              <div className="px-5 pb-5 pt-1">
                <CourseList semesterId={selected._id} deptId={deptId} />
              </div>
            </div>
          )}
        </>
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
