import { Building2, Users } from "lucide-react";
import type { UserRole } from "@/shared/lib/types";

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: "cs", label: "CS", hint: "Controllers" },
  { value: "dcs", label: "DCS", hint: "Deputy controllers" },
  { value: "rs", label: "RS", hint: "Room superintendents" },
  { value: "invigilator", label: "Invigilators", hint: "Faculty invigilators" },
];

interface BroadcastTargetingProps {
  roles: UserRole[];
  departments: string[];
  availableDepartments: string[];
  onToggleRole: (role: UserRole) => void;
  onToggleDepartment: (department: string) => void;
  disabled?: boolean;
}

const pillClass = (selected: boolean, disabled: boolean) =>
  [
    "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    selected
      ? "bg-blue-600 text-white ring-blue-600"
      : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300",
  ].join(" ");

/**
 * Role and department pickers.
 *
 * The two filters intersect on the server — picking "RS" and "CSE" means RS
 * staff in CSE, not everyone who is either. That is stated inline rather than
 * left to be discovered, because the wrong reading sends a message to far
 * more people than intended.
 */
export default function BroadcastTargeting({
  roles,
  departments,
  availableDepartments,
  onToggleRole,
  onToggleDepartment,
  disabled = false,
}: BroadcastTargetingProps) {
  const bothActive = roles.length > 0 && departments.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Roles
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              title={option.hint}
              onClick={() => onToggleRole(option.value)}
              aria-pressed={roles.includes(option.value)}
              className={pillClass(roles.includes(option.value), disabled)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Departments
          </span>
        </div>
        {availableDepartments.length === 0 ? (
          <p className="text-xs text-gray-400">No departments on file.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableDepartments.map((dept) => (
              <button
                key={dept}
                type="button"
                disabled={disabled}
                onClick={() => onToggleDepartment(dept)}
                aria-pressed={departments.includes(dept)}
                className={pillClass(departments.includes(dept), disabled)}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {bothActive && (
        <p className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-800 ring-1 ring-blue-100">
          Both filters are active — this reaches people who match a selected role{" "}
          <strong>and</strong> a selected department.
        </p>
      )}
    </div>
  );
}
