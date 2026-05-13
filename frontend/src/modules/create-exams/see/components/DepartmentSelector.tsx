import { useDepartments } from "@/modules/departments/hooks";

interface DepartmentSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

/**
 * Single-select variant of the CIE DepartmentSelector. Same chip styling
 * but only one department can be active at a time — clicking another
 * department replaces the selection.
 */
export default function DepartmentSelector({ value, onChange }: DepartmentSelectorProps) {
  const { data: departments = [], isLoading } = useDepartments();

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Select Department
      </h3>
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading departments...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => {
            const selected = value === dept._id;
            return (
              <button
                key={dept._id}
                onClick={() => onChange(selected ? "" : dept._id)}
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
      )}
    </section>
  );
}
