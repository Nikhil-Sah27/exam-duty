// Public API for sending notifications from other modules.
// Other modules import ONLY from this file — never from service or repository.
//
// Every emit writes the in-app notification and then fans out to the other
// channels: email for the types in email.dispatcher's EMAILABLE_TYPES,
// WhatsApp for those in whatsapp.dispatcher's WHATSAPPABLE_TYPES, and push
// for those in push.dispatcher's PUSHABLE_TYPES. All three are registered
// through `postCommit`, so when the caller passes a transaction session they
// go out only after that transaction commits — a duty assignment that rolls
// back never reaches anyone's inbox, phone or lock screen. Without a session
// they dispatch immediately, detached, so the request isn't held up by SMTP,
// by WhatsApp or by the Expo push API.
//
// The three channels are dispatched independently: a dead SMTP host must not
// stop the WhatsApp message, a dropped WhatsApp session must not stop the
// email, and a push failure must stop neither.

const notificationRepository = require("./notification.repository");
const templates = require("./notification.templates");
const emailDispatcher = require("../email/email.dispatcher");
const whatsappDispatcher = require("../whatsapp/whatsapp.dispatcher");
const pushDispatcher = require("../push/push.dispatcher");
const postCommit = require("../../shared/utils/postCommit");

/**
 * Queue the email, WhatsApp and push copies for notifications that warrant
 * them. One `onCommit` registration per channel, never one shared callback:
 * a registration that threw would take the channels queued behind it down
 * with it.
 */
const queueChannels = (session, notifications) => {
  const emailable = notifications.filter((n) => emailDispatcher.isEmailable(n.type));
  if (emailable.length) {
    postCommit.onCommit(session, () => emailDispatcher.dispatch(emailable));
  }

  const whatsappable = notifications.filter((n) => whatsappDispatcher.isWhatsAppable(n.type));
  if (whatsappable.length) {
    postCommit.onCommit(session, () => whatsappDispatcher.dispatch(whatsappable));
  }

  const pushable = notifications.filter((n) => pushDispatcher.isPushable(n.type));
  if (pushable.length) {
    postCommit.onCommit(session, () => pushDispatcher.dispatch(pushable));
  }
};

const emit = async (type, { recipient, refModel, refId, data = {}, session } = {}) => {
  const { title, message } = templates[type](data);

  const notification = await notificationRepository.create(
    {
      recipient,
      type,
      title,
      message,
      refModel: refModel || null,
      refId: refId || null,
    },
    session,
  );

  queueChannels(session, [{ type, recipient, data }]);

  return notification;
};

const emitToMany = async (
  type,
  { recipients, refModel, refId, data = {}, session } = {},
) => {
  const { title, message } = templates[type](data);

  const docs = recipients.map((recipient) => ({
    recipient,
    type,
    title,
    message,
    refModel: refModel || null,
    refId: refId || null,
  }));

  const created = await notificationRepository.createMany(docs, session);

  queueChannels(
    session,
    recipients.map((recipient) => ({ type, recipient, data })),
  );

  return created;
};

/**
 * Bulk-emit a heterogeneous batch where each notification has its own
 * `type`, `recipient`, refs, and `data`. The template is resolved per-entry
 * before all docs are written in a single `insertMany`. Used by cascade
 * cleanup flows where every affected teacher gets a per-duty message.
 */
const bulkEmit = async (notifications, { session } = {}) => {
  if (!Array.isArray(notifications) || notifications.length === 0) return [];

  const docs = notifications.map(({ type, recipient, refModel, refId, data = {} }) => {
    const { title, message } = templates[type](data);
    return {
      recipient,
      type,
      title,
      message,
      refModel: refModel || null,
      refId: refId || null,
    };
  });

  const created = await notificationRepository.createMany(docs, session);

  queueChannels(
    session,
    notifications.map(({ type, recipient, data = {} }) => ({ type, recipient, data })),
  );

  return created;
};

module.exports = { emit, emitToMany, bulkEmit };
