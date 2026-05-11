const Notification = require("./notification.model");

const create = (data) => {
  return Notification.create(data);
};

const createMany = (docs) => {
  return Notification.insertMany(docs);
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
