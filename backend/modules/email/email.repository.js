const EmailLog = require("./email.model");

const create = (data) => EmailLog.create(data);

/**
 * Claim a dedupeKey before sending. Returns the created log row, or null when
 * the key already exists (E11000) — i.e. this email has already been handled
 * and the caller should skip it.
 *
 * Claiming up front (rather than logging after the send) is what makes the
 * reminder cron safe to run every 15 minutes: two overlapping runs race on
 * the unique index, and exactly one wins.
 */
const claim = async (data) => {
  try {
    return await EmailLog.create(data);
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
};

const markSent = (id, messageId) =>
  EmailLog.findByIdAndUpdate(
    id,
    { status: "sent", messageId: messageId || null, sentAt: new Date(), error: null },
    { new: true }
  );

const markFailed = (id, error) =>
  EmailLog.findByIdAndUpdate(
    id,
    { status: "failed", error: String(error || "unknown error").slice(0, 500) },
    { new: true }
  );

const markSkipped = (id, reason) =>
  EmailLog.findByIdAndUpdate(id, { status: reason }, { new: true });

const findRecent = (filter = {}, limit = 100) =>
  EmailLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

const countByStatus = async (since) => {
  const match = since ? { createdAt: { $gte: since } } : {};
  const rows = await EmailLog.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

/** Existing dedupeKeys from the given candidate list — used to pre-filter. */
const findExistingKeys = async (keys) => {
  if (!keys.length) return new Set();
  const rows = await EmailLog.find({ dedupeKey: { $in: keys } })
    .select("dedupeKey")
    .lean();
  return new Set(rows.map((r) => r.dedupeKey));
};

module.exports = {
  create,
  claim,
  markSent,
  markFailed,
  markSkipped,
  findRecent,
  countByStatus,
  findExistingKeys,
};
