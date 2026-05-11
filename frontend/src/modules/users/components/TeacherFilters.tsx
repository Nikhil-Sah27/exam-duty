import { ROLES, getRoleLabel } from "@/shared/constants/roles";

interface Filters {
  search: string;
  role: string;
  department: string;
}

interface TeacherFiltersProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  departments: string[];
}

export default function TeacherFilters({
  filters,
  onChange,
  departments,
}: TeacherFiltersProps) {
  const update = (partial: Partial<Filters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="Search name or email..."
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <select
        value={filters.role}
        onChange={(e) => update({ role: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Roles</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {getRoleLabel(r)}
          </option>
        ))}
      </select>

      <select
        value={filters.department}
        onChange={(e) => update({ department: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
