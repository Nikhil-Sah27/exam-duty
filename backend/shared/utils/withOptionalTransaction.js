const mongoose = require("mongoose");

/**
 * Recognises the standalone-Mongo refusal:
 *   "Transaction numbers are only allowed on a replica set member or mongos"
 * Production MongoDB deployments are replica sets and DO support transactions;
 * local dev installs are usually standalone and do not.
 */
const isStandaloneMongoError = (err) => {
  if (!err) return false;
  const msg = String(err.message || "");
  return (
    msg.includes("Transaction numbers are only allowed on a replica set") ||
    err.codeName === "IllegalOperation"
  );
};

/**
 * Run `fn(session)` inside a Mongo transaction when the deployment supports
 * sessions; on standalone Mongo, fall back to running the body once without
 * a session.
 *
 * Repository helpers must therefore accept `session === null` as "no session".
 *
 * Trade-off: on standalone deployments the body is no longer atomic. For
 * single-document writes (the common case here) atomicity is preserved by
 * MongoDB itself; for multi-document writes, fallback is best-effort
 * sequential and partial state is possible. Acceptable for local dev;
 * production is expected to run a replica set.
 */
const withOptionalTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    let result;
    try {
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } catch (err) {
      if (!isStandaloneMongoError(err)) throw err;
      return await fn(null);
    }
  } finally {
    await session.endSession();
  }
};

module.exports = { withOptionalTransaction };
