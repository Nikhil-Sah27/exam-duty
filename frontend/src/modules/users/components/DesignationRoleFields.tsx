import { Select } from "@/shared/components";
import { DESIGNATION_OPTIONS } from "@/shared/constants/designations";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/shared/constants/roles";
import { SELECTABLE_ROLES_FOR_OTHER, resolveRolesFromDesignation, OTHER_DESIGNATION } from "@/shared/utils/roleResolver";
import type { UserRole } from "@/shared/lib/types";

interface Props {
  designation: string;
  onDesignationChange: (value: string) => void;
  role: UserRole;
  onRoleChange: (value: UserRole) => void;
}

const otherRoleOptions = [
  { value: "", label: "Select role..." },
  ...SELECTABLE_ROLES_FOR_OTHER.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
];

// Renders the Designation dropdown and, immediately after it, a Role control
// whose shape follows the business rules for that designation:
//   • HOD/Dean or Professor   → locked chip (single role)
//   • Assoc / Asst Professor  → locked chips (two roles)
//   • Other                   → editable role select (single pick)
export default function DesignationRoleFields({
  designation,
  onDesignationChange,
  role,
  onRoleChange,
}: Props) {
  const fixed = resolveRolesFromDesignation(designation);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Select
        label="Designation"
        value={designation}
        onChange={(e) => onDesignationChange(e.target.value)}
        options={DESIGNATION_OPTIONS}
      />

      {designation === OTHER_DESIGNATION ? (
        <Select
          label="Role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          options={otherRoleOptions}
        />
      ) : (
        <div className="flex flex-col">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Role
          </label>
          <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            {fixed && fixed.length > 0 ? (
              fixed.map((r) => (
                <span
                  key={r}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[r]}`}
                >
                  {ROLE_LABELS[r]}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">
                Choose a designation
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
