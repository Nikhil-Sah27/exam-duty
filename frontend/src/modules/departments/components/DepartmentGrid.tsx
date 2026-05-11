import { Plus, Inbox } from "lucide-react";
import { Department, DepartmentStats } from "../types";
import DepartmentCard from "./DepartmentCard";

interface DepartmentGridProps {
  departments: Department[];
  statsMap: Map<string, DepartmentStats>;
  onAddClick: () => void;
}

export default function DepartmentGrid({
  departments,
  statsMap,
  onAddClick,
}: DepartmentGridProps) {
  if (departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
        <Inbox className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm text-gray-400">No departments yet.</p>
        <button
          onClick={onAddClick}
          className="mt-4 flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Create Department
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {departments.map((d) => (
        <DepartmentCard key={d._id} department={d} stats={statsMap.get(d._id)} />
      ))}
    </div>
  );
}
