import { Pencil, Trash2 } from "lucide-react";
import { Department } from "../types";

interface DepartmentHeaderProps {
  department: Department;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DepartmentHeader({
  department,
  onEdit,
  onDelete,
}: DepartmentHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 text-white shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-sm font-bold tracking-wide">
          {department.code}
        </div>
        <div>
          <h1 className="text-xl font-bold">{department.name}</h1>
          <p className="mt-0.5 text-sm text-gray-400">Department Code: {department.code}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
