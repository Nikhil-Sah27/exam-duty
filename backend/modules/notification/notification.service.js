const AppError = require("../../shared/utils/AppError");
const notificationRepository = require("./notification.repository");

// User-facing CRUD only. For sending notifications, use notification.emitter.js.

const getMyNotifications = async (userId, query) => {
  const filter = {};
  if (query.unread === "true") filter.isRead = false;
  return notificationRepository.findByRecipient(userId, filter);
};

const getUnreadCount = async (userId) => {
  const count = await notificationRepository.countUnread(userId);
  return { count };
};

const markAsRead = async (id, userId) => {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw new AppError("Notification not found", 404);

  if (notification.recipient.toString() !== userId) {
    throw new AppError("Not authorized to mark this notification", 403);
  }

  return notificationRepository.markAsRead(id);
};

const markAllAsRead = async (userId) => {
  return notificationRepository.markAllAsRead(userId);
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
