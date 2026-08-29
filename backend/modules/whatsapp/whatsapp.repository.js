const WhatsAppLog = require("./whatsapp.model");

const create = (data) => WhatsAppLog.create(data);

/**
 * Claim a dedupeKey before sending. Returns null when the key already exists,
 * meaning another run owns this message and the caller should skip it.
 * Same contract as the email repository's `claim`.
 */
const claim = async (data) => {
  try {
    return await WhatsAppLog.create(data);
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
};

/**
 * Attach the rendered body to a row that was claimed before the message was
 * built (the reminder path claims its key up front). Without this the audit
 * log would record that something was sent but not what it said.
 */
const setBody = (id, body) =>
  WhatsAppLog.findByIdAndUpdate(id, { body: String(body || "").slice(0, 2000) }, { new: true });

const markSent = (id, messageId, provider) =>
  WhatsAppLog.findByIdAndUpdate(
    id,
    {
      status: "sent",
      messageId: messageId || null,
      provider: provider || "none",
      sentAt: new Date(),
      error: null,
    },
    { new: true }
  );

const markFailed = (id, error, provider) =>
  WhatsAppLog.findByIdAndUpdate(
    id,
    {
      status: "failed",
      provider: provider || "none",
      error: String(error || "unknown error").slice(0, 500),
    },
    { new: true }
  );

const markSkipped = (id, reason) =>
  WhatsAppLog.findByIdAndUpdate(id, { status: reason }, { new: true });

const findRecent = (filter = {}, limit = 100) =>
  WhatsAppLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

const countByStatus = async (since) => {
  const match = since ? { createdAt: { $gte: since } } : {};
  const rows = await WhatsAppLog.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

const findExistingKeys = async (keys) => {
  if (!keys.length) return new Set();
  const rows = await WhatsAppLog.find({ dedupeKey: { $in: keys } })
    .select("dedupeKey")
    .lean();
  return new Set(rows.map((r) => r.dedupeKey));
};

module.exports = {
  create,
  claim,
  setBody,
  markSent,
  markFailed,
  markSkipped,
  findRecent,
  countByStatus,
  findExistingKeys,
};
