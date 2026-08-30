const notificationService = require("./notification.service");
const catchAsync = require("../../shared/utils/catchAsync");

const getMine = catchAsync(async (req, res) => {
  const notifications = await notificationService.getMyNotifications(
    req.user.id, req.query
  );
  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json({ success: true, data: result });
});

const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id, req.user.id
  );
  res.status(200).json({ success: true, data: notification });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.status(200).json({ success: true, message: "All notifications marked as read" });
});

const remove = catchAsync(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.params.id, req.user.id
  );
  res.status(200).json({ success: true, ...result });
});

const removeAll = catchAsync(async (req, res) => {
  const result = await notificationService.deleteAllNotifications(req.user.id);
  res.status(200).json({ success: true, ...result });
});


// CS-only. Resolves the current filter selection to a recipient list so the
// compose screen can show "this will reach 42 people" before anything sends.
const previewBroadcast = catchAsync(async (req, res) => {
  const data = await notificationService.previewBroadcastRecipients({
    roles: req.body?.roles || [],
    departments: req.body?.departments || [],
  });
  res.status(200).json({ success: true, data });
});

const broadcast = catchAsync(async (req, res) => {
  const data = await notificationService.sendBroadcast(req.body, req.user.id);
  res.status(200).json({ success: true, data });
});


const updateChannelPreferences = catchAsync(async (req, res) => {
  const data = await notificationService.updateChannelPreferences(req.user.id, {
    emailNotifications: req.body?.emailNotifications,
    whatsappNotifications: req.body?.whatsappNotifications,
    pushNotifications: req.body?.pushNotifications,
  });
  res.status(200).json({ success: true, data });
});

module.exports = {
  getMine,
  previewBroadcast,
  broadcast,
  updateChannelPreferences,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
  removeAll,
};
