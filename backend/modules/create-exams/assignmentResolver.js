// Parses a per-slot assignment token into the concrete list of Course IDs
// that should be persisted as CIEPlanEntry rows.
//
// Accepted token shapes (from RoutineStep / SEE course picker):
//   • "course:<courseId>"  → single Course
//   • "group:<electiveGroupId>" → all Courses linked to this ElectiveGroup
//   • "<courseId>" (bare, no prefix) → treated as "course:<courseId>" for
//     backwards-compat with older clients

const AppError = require("../../shared/utils/AppError");
const Course = require("../department/course.model");

const parseToken = (token) => {
  if (!token || typeof token !== "string") return null;
  const idx = token.indexOf(":");
  if (idx < 0) return { kind: "course", id: token };
  const kind = token.slice(0, idx);
  const id = token.slice(idx + 1);
  if (!id) return null;
  if (kind === "course" || kind === "group") return { kind, id };
  return null;
};

/**
 * Resolve a single assignment token to the concrete Course IDs to persist.
 *
 * @param {string} token — course:<id>, group:<id>, or bare <id>
 * @returns {Promise<{courseIds: string[], electiveGroupId: string|null}>}
 */
const resolveAssignment = async (token) => {
  const parsed = parseToken(token);
  if (!parsed) {
    throw new AppError(`Invalid assignment token: ${token}`, 400);
  }

  if (parsed.kind === "course") {
    return { courseIds: [parsed.id], electiveGroupId: null };
  }

  // group:<electiveGroupId> — fan out to every member course.
  const members = await Course.find({ electiveGroup: parsed.id }).select("_id");
  if (members.length === 0) {
    throw new AppError(
      `Elective group ${parsed.id} has no member courses`,
      400
    );
  }
  return {
    courseIds: members.map((c) => String(c._id)),
    electiveGroupId: parsed.id,
  };
};

module.exports = {
  parseToken,
  resolveAssignment,
};
