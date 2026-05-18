const repository = require("./audit.repository");

/**
 * Write a single audit log entry. Optionally participates in an existing
 * Mongo transaction via `session` so the log is committed atomically with
 * whatever data change it describes — or rolled back if that change fails.
 *
 * `details` is `Mixed`, so callers can attach any action-specific metadata
 * (affectedTeachers, affectedRooms, releasedDutyIds, …). Keep it flat-ish so
 * Mongo can index/query it later if we ever want server-side filters.
 */
const log = async (
  { action, entity, entityId = null, performedBy, details = null, ipAddress = null },
  session,
) => {
  if (!action) throw new Error("audit.log: action is required");
  if (!entity) throw new Error("audit.log: entity is required");
  if (!performedBy) throw new Error("audit.log: performedBy is required");

  return repository.create(
    { action, entity, entityId, performedBy, details, ipAddress },
    session,
  );
};

const list = async (filter = {}) => repository.findAll(filter);

const getById = async (id) => repository.findById(id);

module.exports = { log, list, getById };
