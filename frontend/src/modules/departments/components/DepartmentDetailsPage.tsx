import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  useDepartments,
  useDepartmentStats,
  useUpdateDepartment,
  useDeleteDepartment,
} from "../hooks";
import DepartmentHeader from "./DepartmentHeader";
import SemesterList from "./SemesterList";
import DepartmentModal from "./DepartmentModal";
import { ConfirmDeleteModal } from "@/shared/components";

export default function DepartmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: departments, isLoading } = useDepartments();
  const { data: stats, isLoading: statsLoading } = useDepartmentStats(id!);

  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dept = (departments || []).find((d) => d._id === id);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!dept) return <p className="text-red-600">Department not found.</p>;

  const handleUpdate = (data: { name: string; code: string }) => {
    updateMutation.mutate(
      { id: dept._id, data },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(dept._id, {
      onSuccess: () => navigate("/departments"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-400">
        <Link to="/departments" className="transition-colors hover:text-gray-700">
          Departments
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-700">{dept.name}</span>
      </nav>

      {/* Header — absorbs stats inline */}
      <DepartmentHeader
        department={dept}
        stats={stats}
        statsLoading={statsLoading}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* Semesters */}
      <SemesterList deptId={id!} />

      {/* Edit Modal */}
      <DepartmentModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        error={updateMutation.error}
        editDept={dept}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Department"
        message={`This will permanently delete "${dept.name}" and all its semesters and courses. This action cannot be undone.`}
      />
    </div>
  );
}
