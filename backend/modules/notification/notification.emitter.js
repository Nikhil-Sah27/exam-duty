// Public API for sending notifications from other modules.
// Other modules import ONLY from this file — never from service or repository.

const notificationRepository = require("./notification.repository");
const templates = require("./notification.templates");

const emit = async (type, { recipient, refModel, refId, data = {} }) => {
  const { title, message } = templates[type](data);

  return notificationRepository.create({
    recipient,
    type,
    title,
    message,
    refModel: refModel || null,
    refId: refId || null,
  });
};

const emitToMany = async (type, { recipients, refModel, refId, data = {} }) => {
  const { title, message } = templates[type](data);

  const docs = recipients.map((recipient) => ({
    recipient,
    type,
    title,
    message,
    refModel: refModel || null,
    refId: refId || null,
  }));

  return notificationRepository.createMany(docs);
};

module.exports = { emit, emitToMany };
