import { useDepartments } from "@/modules/departments/hooks";

interface DepartmentSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function DepartmentSelector({ selectedIds, onToggle }: DepartmentSelectorProps) {
  const { data: departments = [], isLoading } = useDepartments();

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Departments</h3>
        <p className="text-sm text-gray-400">Loading departments...</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Departments</h3>
      <div className="flex flex-wrap gap-2">
        {departments.map((dept) => {
          const selected = selectedIds.includes(dept._id);
          return (
            <button
              key={dept._id}
              onClick={() => onToggle(dept._id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {dept.code}
            </button>
          );
        })}
      </div>
    </section>
  );
}
