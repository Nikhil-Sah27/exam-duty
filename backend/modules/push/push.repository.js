const PushLog = require("./pushLog.model");
const PushToken = require("./pushToken.model");

// --- device registry --------------------------------------------------------

/**
 * Register (or re-register) a device. Keyed on the token, so the same handset
 * re-registering on every app launch updates one row instead of adding one.
 *
 * The upsert can still lose a race with a concurrent registration of the same
 * token — two app launches in flight at once — which surfaces as E11000. The
 * row exists by then, so the retry is a plain update.
 */
const registerToken = async ({ user, token, platform, deviceName }) => {
  const update = {
    user,
    platform: platform || "unknown",
    deviceName: deviceName || null,
    lastSeenAt: new Date(),
  };

  try {
    return await PushToken.findOneAndUpdate({ token }, { $set: update }, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    return PushToken.findOneAndUpdate({ token }, { $set: update }, { new: true });
  }
};

/** Deregister on sign-out. Scoped to the owner so one user cannot mute another. */
const removeToken = (token, userId) => PushToken.deleteOne({ token, user: userId });

/**
 * Delete a token Expo has reported as `DeviceNotRegistered`. Unscoped on
 * purpose: the token is dead for everyone, whoever the row currently belongs to.
 */
const removeDeadToken = (token) => PushToken.deleteOne({ token });

const findTokensForUsers = async (userIds) => {
  if (!userIds.length) return [];
  return PushToken.find({ user: { $in: userIds } })
    .select("user token platform")
    .lean();
};

const countTokens = () => PushToken.countDocuments({});

const countTokensByPlatform = async () => {
  const rows = await PushToken.aggregate([
    { $group: { _id: "$platform", count: { $sum: 1 } } },
  ]);
  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

// --- send log ---------------------------------------------------------------

const create = (data) => PushLog.create(data);

/**
 * Claim a dedupeKey before sending. Returns the created log row, or null when
 * the key already exists (E11000) — i.e. this push has already been handled
 * and the caller should skip it. Same contract as the email repository's `claim`.
 */
const claim = async (data) => {
  try {
    return await PushLog.create(data);
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
};

const markSent = (id, ticketId) =>
  PushLog.findByIdAndUpdate(
    id,
    { status: "sent", ticketId: ticketId || null, sentAt: new Date(), error: null },
    { new: true }
  );

const markFailed = (id, error) =>
  PushLog.findByIdAndUpdate(
    id,
    { status: "failed", error: String(error || "unknown error").slice(0, 500) },
    { new: true }
  );

/** Terminal, and distinct from `failed`: the device is gone, not unreachable. */
const markUnregistered = (id, error) =>
  PushLog.findByIdAndUpdate(
    id,
    { status: "unregistered", error: String(error || "DeviceNotRegistered").slice(0, 500) },
    { new: true }
  );

const markSkipped = (id, reason) =>
  PushLog.findByIdAndUpdate(id, { status: reason }, { new: true });

const findRecent = (filter = {}, limit = 100) =>
  PushLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

const countByStatus = async (since) => {
  const match = since ? { createdAt: { $gte: since } } : {};
  const rows = await PushLog.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

/** Existing dedupeKeys from the given candidate list — used to pre-filter. */
const findExistingKeys = async (keys) => {
  if (!keys.length) return new Set();
  const rows = await PushLog.find({ dedupeKey: { $in: keys } })
    .select("dedupeKey")
    .lean();
  return new Set(rows.map((r) => r.dedupeKey));
};

module.exports = {
  registerToken,
  removeToken,
  removeDeadToken,
  findTokensForUsers,
  countTokens,
  countTokensByPlatform,
  create,
  claim,
  markSent,
  markFailed,
  markUnregistered,
  markSkipped,
  findRecent,
  countByStatus,
  findExistingKeys,
};
