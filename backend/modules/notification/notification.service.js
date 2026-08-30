const AppError = require("../../shared/utils/AppError");
const notificationRepository = require("./notification.repository");
const notificationTemplates = require("./notification.templates");
const emailService = require("../email/email.service");
const whatsappService = require("../whatsapp/whatsapp.service");
const phone = require("../whatsapp/phone.utils");
const User = require("../auth/auth.model");

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

// Ownership-checked delete. 404 on missing wins over 403 on wrong-owner so
// we don't leak the existence of another user's notification.
const deleteNotification = async (id, userId) => {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw new AppError("Notification not found", 404);

  if (notification.recipient.toString() !== userId) {
    throw new AppError("Not authorized to delete this notification", 403);
  }

  await notificationRepository.deleteById(id);
  return { deleted: 1 };
};

// Repository filter is recipient-scoped, so this can never delete another
// user's notifications regardless of caller intent.
const deleteAllNotifications = async (userId) => {
  const result = await notificationRepository.deleteAllByRecipient(userId);
  return { deleted: result.deletedCount ?? 0 };
};


const VALID_ROLES = ["cs", "dcs", "rs", "invigilator"];

const MAX_TITLE = 120;
const MAX_MESSAGE = 4000;

/**
 * Validate and normalise a broadcast request.
 *
 * At least one targeting filter is mandatory. An unfiltered send would go to
 * every account in the system, and that is too easy to trigger by accident
 * from a form with nothing ticked — "select every role" is the explicit way
 * to say everyone.
 */
const parseBroadcast = (body = {}) => {
  const title = String(body.title || "").trim();
  const message = String(body.message || "").trim();

  if (!title) throw new AppError("Title is required", 400);
  if (!message) throw new AppError("Message is required", 400);
  if (title.length > MAX_TITLE) {
    throw new AppError(`Title must be ${MAX_TITLE} characters or fewer`, 400);
  }
  if (message.length > MAX_MESSAGE) {
    throw new AppError(`Message must be ${MAX_MESSAGE} characters or fewer`, 400);
  }

  const roles = [...new Set((body.roles || []).map((r) => String(r).trim()).filter(Boolean))];
  const departments = [
    ...new Set((body.departments || []).map((d) => String(d).trim()).filter(Boolean)),
  ];

  const invalid = roles.filter((r) => !VALID_ROLES.includes(r));
  if (invalid.length) {
    throw new AppError(`Unknown role(s): ${invalid.join(", ")}`, 400);
  }
  if (!roles.length && !departments.length) {
    throw new AppError(
      "Select at least one role or department — an untargeted broadcast is not allowed",
      400,
    );
  }

  return {
    title,
    message,
    roles,
    departments,
    sendEmail: body.sendEmail !== false,
    // Opt-in rather than opt-out: WhatsApp is the most intrusive channel, and
    // on the Cloud API each send costs money, so it should be a deliberate tick.
    sendWhatsApp: body.sendWhatsApp === true,
  };
};

/** Who a given set of filters resolves to. Read-only; drives the live count. */
const previewBroadcastRecipients = async ({ roles = [], departments = [] } = {}) => {
  const recipients = await notificationRepository.findBroadcastRecipients({
    roles,
    departments,
  });

  const reachableOnWhatsApp = (r) =>
    phone.normalize(r.phone).ok && r.whatsappNotifications !== false;

  return {
    total: recipients.length,
    withEmail: recipients.filter((r) => r.email && r.emailNotifications !== false).length,
    withoutEmail: recipients.filter((r) => !r.email).length,
    optedOut: recipients.filter((r) => r.email && r.emailNotifications === false).length,
    withWhatsApp: recipients.filter(reachableOnWhatsApp).length,
    withoutWhatsApp: recipients.filter((r) => !phone.normalize(r.phone).ok).length,
    whatsappOptedOut: recipients.filter(
      (r) => phone.normalize(r.phone).ok && r.whatsappNotifications === false,
    ).length,
    recipients: recipients.map((r) => ({
      id: String(r._id),
      name: r.name,
      email: r.email || null,
      department: r.department || null,
      roles: r.roles || [],
      emailNotifications: r.emailNotifications !== false,
      // Masked — the screen needs to know a number is usable, not what it is.
      phone: phone.normalize(r.phone).ok ? phone.mask(phone.normalize(r.phone).e164) : null,
      whatsappNotifications: r.whatsappNotifications !== false,
    })),
  };
};

/**
 * Send an admin broadcast: an in-app notification to every resolved recipient
 * plus, when requested, an email copy.
 *
 * The in-app write is a single insertMany and happens first — it is the
 * channel that always works. Email goes out afterwards through the bounded
 * batch sender and reports per-status counts, so a partial SMTP failure is
 * visible in the response rather than silent. Neither an SMTP outage nor an
 * unconfigured transport fails the call: the message still reached everyone
 * inside the app.
 *
 * Deliberately not deduped — the same announcement may legitimately be sent
 * twice (a correction, a reminder), and the sender is a human clicking a
 * button, not a retrying job.
 */
const sendBroadcast = async (body, senderId) => {
  const input = parseBroadcast(body);

  const recipients = await notificationRepository.findBroadcastRecipients({
    roles: input.roles,
    departments: input.departments,
  });

  if (!recipients.length) {
    throw new AppError("No active users match the selected roles/departments", 400);
  }

  const sender = await User.findById(senderId).select("name").lean();
  const { title, message } = notificationTemplates.admin_message({
    title: input.title,
    message: input.message,
  });

  await notificationRepository.createMany(
    recipients.map((r) => ({
      recipient: r._id,
      type: "admin_message",
      title,
      message,
      sentBy: senderId,
      refModel: null,
      refId: null,
    })),
  );

  const result = {
    notified: recipients.length,
    email: { requested: input.sendEmail },
    whatsapp: { requested: input.sendWhatsApp },
  };

  const payload = (r) => ({
    name: r.name,
    title: input.title,
    message: input.message,
    senderName: sender?.name || null,
  });

  if (input.sendEmail) {
    const mailable = recipients.filter((r) => r.email);
    const sends = await emailService.sendBatch(
      mailable.map((r) => ({
        to: r.email,
        type: "admin_message",
        recipient: r._id,
        optedOut: r.emailNotifications === false,
        data: payload(r),
      })),
    );

    result.email = {
      requested: true,
      attempted: mailable.length,
      noAddress: recipients.length - mailable.length,
      ...emailService.summarize(sends),
    };
  }

  if (input.sendWhatsApp) {
    // Filtered on a *parseable* number, not merely a present one — an
    // unusable string would otherwise be counted as an attempt.
    const reachable = recipients.filter((r) => phone.normalize(r.phone).ok);
    const sends = await whatsappService.sendBatch(
      reachable.map((r) => ({
        to: r.phone,
        type: "admin_message",
        recipient: r._id,
        optedOut: r.whatsappNotifications === false,
        data: payload(r),
      })),
    );

    result.whatsapp = {
      requested: true,
      attempted: reachable.length,
      noNumber: recipients.length - reachable.length,
      ...whatsappService.summarize(sends),
    };
  }

  return result;
};


/**
 * Self-service channel opt-outs. Scoped to the caller — the id comes from the
 * JWT, never the body, so this cannot mute someone else. In-app notifications
 * are unaffected by design: opting out of a channel must not make a duty
 * change invisible.
 *
 * Every field is optional; only the ones supplied are written, so a client
 * can toggle one without having to send the others' current values back.
 */
const updateChannelPreferences = async (
  userId,
  { emailNotifications, whatsappNotifications, pushNotifications },
) => {
  const update = {};
  if (emailNotifications !== undefined) {
    if (typeof emailNotifications !== "boolean") {
      throw new AppError("emailNotifications must be true or false", 400);
    }
    update.emailNotifications = emailNotifications;
  }
  if (whatsappNotifications !== undefined) {
    if (typeof whatsappNotifications !== "boolean") {
      throw new AppError("whatsappNotifications must be true or false", 400);
    }
    update.whatsappNotifications = whatsappNotifications;
  }
  if (pushNotifications !== undefined) {
    if (typeof pushNotifications !== "boolean") {
      throw new AppError("pushNotifications must be true or false", 400);
    }
    update.pushNotifications = pushNotifications;
  }

  if (!Object.keys(update).length) {
    throw new AppError(
      "Provide emailNotifications, whatsappNotifications and/or pushNotifications as booleans",
      400,
    );
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select(
    "emailNotifications whatsappNotifications pushNotifications",
  );
  if (!user) throw new AppError("User not found", 404);

  return {
    emailNotifications: user.emailNotifications !== false,
    whatsappNotifications: user.whatsappNotifications !== false,
    pushNotifications: user.pushNotifications !== false,
  };
};

module.exports = {
  getMyNotifications,
  previewBroadcastRecipients,
  sendBroadcast,
  updateChannelPreferences,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
