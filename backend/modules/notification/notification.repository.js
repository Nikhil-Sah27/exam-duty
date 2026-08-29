const Notification = require("./notification.model");
const User = require("../auth/auth.model");

const create = (data, session) => {
  if (session) return Notification.create([data], { session }).then((d) => d[0]);
  return Notification.create(data);
};

const createMany = (docs, session) => {
  return Notification.insertMany(docs, session ? { session } : {});
};

/**
 * Create a notification that must exist at most once, identified by its
 * `dedupeKey`. Returns null when the key is already taken (E11000) — meaning
 * another run already produced this notification and the caller should skip.
 */
const claim = async (data) => {
  try {
    return await Notification.create(data);
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
};

const findByRecipient = (recipientId, filter = {}) => {
  return Notification.find({ recipient: recipientId, ...filter })
    .sort({ createdAt: -1 })
    .limit(50);
};

const countUnread = (recipientId) => {
  return Notification.countDocuments({ recipient: recipientId, isRead: false });
};

const findById = (id) => {
  return Notification.findById(id);
};

const markAsRead = (id) => {
  return Notification.findByIdAndUpdate(
    id,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

const markAllAsRead = (recipientId) => {
  return Notification.updateMany(
    { recipient: recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

const deleteById = (id) => {
  return Notification.findByIdAndDelete(id);
};

// Intrinsically recipient-scoped — never deletes another user's notifications,
// even if a future caller forgets to verify ownership upstream.
const deleteAllByRecipient = (recipientId) => {
  return Notification.deleteMany({ recipient: recipientId });
};

/**
 * Recipients for an admin broadcast.
 *
 * `roles` and `departments` intersect when both are given — "all RS in CSE"
 * is the common ask, not "everyone who is an RS plus everyone in CSE". Each
 * filter is skipped when its list is empty, and the soft-delete pre-hook on
 * User keeps deactivated accounts out without an explicit isActive clause.
 */
const findBroadcastRecipients = ({ roles = [], departments = [] } = {}) => {
  const filter = {};
  if (roles.length) filter.roles = { $in: roles };
  if (departments.length) filter.department = { $in: departments };

  return User.find(filter)
    .select("name email phone department roles emailNotifications whatsappNotifications")
    .sort({ name: 1 })
    .lean();
};

module.exports = {
  create,
  createMany,
  claim,
  findBroadcastRecipients,
  findByRecipient,
  countUnread,
  findById,
  markAsRead,
  markAllAsRead,
  deleteById,
  deleteAllByRecipient,
};
