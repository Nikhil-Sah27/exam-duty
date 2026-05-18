// Public API for sending notifications from other modules.
// Other modules import ONLY from this file — never from service or repository.

const notificationRepository = require("./notification.repository");
const templates = require("./notification.templates");

const emit = async (type, { recipient, refModel, refId, data = {}, session } = {}) => {
  const { title, message } = templates[type](data);

  return notificationRepository.create(
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

  return notificationRepository.createMany(docs, session);
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

  return notificationRepository.createMany(docs, session);
};

module.exports = { emit, emitToMany, bulkEmit };
