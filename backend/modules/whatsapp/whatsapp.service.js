const providers = require("./providers");
const whatsappRepository = require("./whatsapp.repository");
const { templates } = require("./whatsapp.templates");
const phone = require("./phone.utils");

/**
 * Outbound WhatsApp, with a WhatsAppLog row for every attempt.
 *
 * Same two rules as the email service, for the same reasons:
 *   1. Sending never throws into the caller. A dropped WhatsApp session must
 *      not fail a duty assignment that already committed.
 *   2. Every attempt is recorded — including sends skipped because no
 *      provider is configured, the user opted out, or the stored phone number
 *      could not be resolved to a real one.
 *
 * The third skip reason is specific to this channel: `User.phone` is free
 * text and frequently unusable. Those are logged as `skipped_invalid_number`
 * so a bad roster is visible as data rather than as silence.
 */

const render = (type, data) => {
  const build = templates[type];
  if (!build) throw new Error(`unknown WhatsApp template "${type}"`);
  return build(data);
};

/** Push one rendered message out and reconcile its log row. Never throws. */
const deliver = async (log, rendered, { waId, optedOut }) => {
  if (optedOut) {
    await whatsappRepository.markSkipped(log._id, "skipped_opted_out");
    return { status: "skipped_opted_out", logId: String(log._id) };
  }

  const provider = providers.get();
  if (!provider.isConfigured()) {
    // Row was created as skipped_not_configured — leave it.
    return { status: "skipped_not_configured", logId: String(log._id) };
  }

  const result = await provider.send(waId, rendered);
  if (result.ok) {
    await whatsappRepository.markSent(log._id, result.messageId, provider.name);
    return { status: "sent", logId: String(log._id) };
  }

  console.error(`[whatsapp] send failed (${log.type} → ${phone.mask(log.to)}): ${result.error}`);
  await whatsappRepository.markFailed(log._id, result.error, provider.name);
  return { status: "failed", logId: String(log._id), reason: result.error };
};

/**
 * Send one WhatsApp message.
 *
 * @param {object}  opts
 * @param {string}  opts.to           raw phone number, any format
 * @param {string}  opts.type         template key
 * @param {object}  opts.data         template payload
 * @param {string}  [opts.recipient]  User _id, for log attribution
 * @param {string}  [opts.dedupeKey]  stable key for at-most-once sends
 * @param {boolean} [opts.optedOut]   caller-resolved opt-out flag
 */
const sendMessage = async ({
  to,
  type,
  data = {},
  recipient = null,
  dedupeKey = null,
  optedOut = false,
}) => {
  const parsed = phone.normalize(to);

  let rendered;
  try {
    rendered = render(type, data);
  } catch (err) {
    console.error(`[whatsapp] ${err.message}`);
    return { status: "failed", reason: err.message };
  }

  const row = {
    to: parsed.ok ? parsed.e164 : String(to ?? "").slice(0, 40) || "(none)",
    recipient,
    type,
    provider: providers.get().name,
    body: rendered.body?.slice(0, 2000) || null,
    dedupeKey: dedupeKey || null,
    status: "skipped_not_configured",
  };

  let log;
  if (dedupeKey) {
    log = await whatsappRepository.claim(row);
    if (!log) return { status: "duplicate", reason: "already sent" };
  } else {
    log = await whatsappRepository.create(row);
  }

  // Resolved after the claim so an unusable number still consumes its key and
  // shows up in the log, rather than being retried on every run.
  if (!parsed.ok) {
    await whatsappRepository.markSkipped(log._id, "skipped_invalid_number");
    return { status: "skipped_invalid_number", logId: String(log._id), reason: parsed.reason };
  }

  return deliver(log, rendered, { waId: parsed.digits, optedOut });
};

/** Send against a log row the caller already claimed. */
const sendClaimed = async (log, { to, type, data = {}, optedOut = false }) => {
  const parsed = phone.normalize(to);
  if (!parsed.ok) {
    await whatsappRepository.markSkipped(log._id, "skipped_invalid_number");
    return { status: "skipped_invalid_number", logId: String(log._id), reason: parsed.reason };
  }

  let rendered;
  try {
    rendered = render(type, data);
  } catch (err) {
    await whatsappRepository.markFailed(log._id, err.message, providers.get().name);
    return { status: "failed", logId: String(log._id), reason: err.message };
  }

  // The row was claimed before the body existed; record it now so the log
  // shows what was actually sent.
  await whatsappRepository.setBody(log._id, rendered.body);

  return deliver(log, rendered, { waId: parsed.digits, optedOut });
};

/**
 * Send a batch with bounded concurrency.
 *
 * The cap is lower than the email one on purpose: WhatsApp rate-limits
 * aggressively, and whatsapp-web.js drives a single browser session that
 * serialises anyway.
 */
const sendBatch = async (messages, { concurrency = 3 } = {}) => {
  const results = new Array(messages.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < messages.length) {
      const index = cursor++;
      results[index] = await sendMessage(messages[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, messages.length) }, worker),
  );

  return results;
};

const summarize = (results) =>
  results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

/** Render without sending — powers the compose-screen preview. */
const preview = (type, data = {}) => render(type, data);

module.exports = { sendMessage, sendClaimed, sendBatch, summarize, preview };
