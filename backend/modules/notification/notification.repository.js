const Notification = require("./notification.model");

const create = (data, session) => {
  if (session) return Notification.create([data], { session }).then((d) => d[0]);
  return Notification.create(data);
};

const createMany = (docs, session) => {
  return Notification.insertMany(docs, session ? { session } : {});
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

module.exports = {
  create,
  createMany,
  findByRecipient,
  countUnread,
  findById,
  markAsRead,
  markAllAsRead,
};
