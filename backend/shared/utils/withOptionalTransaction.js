const mongoose = require("mongoose");
const postCommit = require("./postCommit");

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
 * External side effects (email) registered via `postCommit.onCommit(session, …)`
 * inside the body are flushed only after the transaction commits, and dropped
 * if it aborts — so a rolled-back duty assignment never emails anyone.
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
      postCommit.runCommitted(session);
      return result;
    } catch (err) {
      postCommit.discard(session);
      if (!isStandaloneMongoError(err)) throw err;
      // Retry without a session — `onCommit(null, …)` then fires immediately.
      return await fn(null);
    }
  } finally {
    await session.endSession();
  }
};

module.exports = { withOptionalTransaction };
