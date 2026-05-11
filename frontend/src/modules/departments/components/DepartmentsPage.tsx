import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useDepartments, useCreateDepartment } from "../hooks";
import { useDepartmentStats } from "../hooks";
import { Department, DepartmentStats } from "../types";
import DepartmentGrid from "./DepartmentGrid";
import DepartmentModal from "./DepartmentModal";

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();
  const [modalOpen, setModalOpen] = useState(false);

  const createMutation = useCreateDepartment();

  // Fetch stats for each department
  const depts = departments || [];
  const [statsMap, setStatsMap] = useState<Map<string, DepartmentStats>>(new Map());

  // Use individual stat queries via a child wrapper
  // Simpler approach: render hidden stat fetchers
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage departments, semesters, and courses.
          </p>
        </div>
        {depts.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Department
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading departments...</p>
      ) : (
        <>
          {/* Stat fetchers */}
          {depts.map((d) => (
            <StatFetcher key={d._id} deptId={d._id} onStats={(s) => {
              setStatsMap((prev) => {
                const next = new Map(prev);
                next.set(d._id, s);
                return next;
              });
            }} />
          ))}

          <DepartmentGrid
            departments={depts}
            statsMap={statsMap}
            onAddClick={() => setModalOpen(true)}
          />
        </>
      )}

      <DepartmentModal
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
    </div>
  );
}

/** Invisible component that fetches stats for a single department */
function StatFetcher({
  deptId,
  onStats,
}: {
  deptId: string;
  onStats: (stats: DepartmentStats) => void;
}) {
  const { data } = useDepartmentStats(deptId);

  useEffect(() => {
    if (data) onStats(data);
  }, [data]);

  return null;
}
