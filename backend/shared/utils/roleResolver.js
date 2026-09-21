// Designation → allowed roles map. Single source of truth on the backend.
// Keep in sync with frontend/src/shared/utils/roleResolver.ts.

const DESIGNATION_ROLE_MAP = {
  "HOD/Dean": ["dcs"],
  "Professor": ["rs"],
  "Associate Professor": ["rs", "invigilator"],
  "Assistant Professor": ["rs", "invigilator"],
};

const OTHER_DESIGNATION = "Other";

// "cs" (Controller of Superintendents) is the full-admin role and is
// deliberately NOT in the default selectable set. It is privileged: it may be
// granted ONLY by a caller that is already authenticated as CS — i.e. the
// requireRole("cs")-guarded POST/PUT /users paths, which pass { allowCs: true }.
// Any other path (the legacy public /auth/register, self-service, etc.) can
// never mint an admin, even if the route guard were somehow bypassed.
const SELECTABLE_ROLES_FOR_OTHER = ["dcs", "rs", "invigilator"];
const PRIVILEGED_ROLE = "cs";

// Returns:
//   • an array of roles fixed by the designation (caller cannot override)
//   • null when the designation is "Other" (caller picks a single role from the allowed set)
const resolveRolesFromDesignation = (designation) => {
  if (designation === OTHER_DESIGNATION) return null;
  return DESIGNATION_ROLE_MAP[designation] || null;
};

// Enforce the rules on create/update. Returns the roles array to persist.
// Throws if the requested roles violate the designation rule.
// `allowCs` must be true only when the CALLER is already a verified CS admin.
const enforceRolesForDesignation = (
  designation,
  requestedRoles,
  { allowCs = false } = {}
) => {
  const fixed = resolveRolesFromDesignation(designation);
  if (fixed) return fixed;

  // Designation is "Other" (or missing) — caller must supply exactly one role from the allowed set.
  if (!Array.isArray(requestedRoles) || requestedRoles.length !== 1) {
    const err = new Error(
      'When designation is "Other", exactly one role must be provided'
    );
    err.statusCode = 400;
    throw err;
  }
  const [role] = requestedRoles;
  const allowed = allowCs
    ? [...SELECTABLE_ROLES_FOR_OTHER, PRIVILEGED_ROLE]
    : SELECTABLE_ROLES_FOR_OTHER;
  if (!allowed.includes(role)) {
    const err = new Error(`Role "${role}" is not selectable`);
    err.statusCode = 400;
    throw err;
  }
  return [role];
};

module.exports = {
  DESIGNATION_ROLE_MAP,
  OTHER_DESIGNATION,
  SELECTABLE_ROLES_FOR_OTHER,
  resolveRolesFromDesignation,
  enforceRolesForDesignation,
};
