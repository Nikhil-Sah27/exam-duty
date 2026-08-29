const transport = require("./email.transport");
const emailRepository = require("./email.repository");
const { templates } = require("./email.templates");

/**
 * Outbound email, with an EmailLog row for every attempt.
 *
 * Two rules hold everywhere in this module:
 *
 *   1. Sending NEVER throws into the caller. Email is a secondary channel;
 *      a dead SMTP host must not fail a duty assignment that already
 *      committed. Failures land in EmailLog with status `failed`.
 *   2. Every attempt is recorded — including the ones skipped because SMTP
 *      isn't configured yet or the user opted out. That log is how you
 *      answer "did Asha get told?" without SMTP-side access.
 *
 * Two entry points, differing only in who owns the idempotency claim:
 *   • sendEmail    — claims the dedupeKey itself (or sends unkeyed).
 *   • sendClaimed  — the caller already claimed a log row and wants the send
 *                    tied to it. The reminder job uses this so the in-app
 *                    notification and the email share one at-most-once gate.
 */

const SEND_TIMEOUT_MS = 20_000;

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`SMTP send timed out after ${ms}ms`)), ms),
    ),
  ]);

const render = (type, data) => {
  const build = templates[type];
  if (!build) throw new Error(`unknown email template "${type}"`);
  return build(data);
};

/** Push one rendered message out and reconcile its log row. Never throws. */
const deliver = async (log, rendered, { to, optedOut }) => {
  if (optedOut) {
    await emailRepository.markSkipped(log._id, "skipped_opted_out");
    return { status: "skipped_opted_out", logId: String(log._id) };
  }

  const mailer = transport.getTransport();
  if (!mailer) {
    // The row was created as skipped_not_configured — leave it and move on.
    return { status: "skipped_not_configured", logId: String(log._id) };
  }

  try {
    const info = await withTimeout(
      mailer.sendMail({
        from: transport.getFrom(),
        replyTo: transport.getReplyTo(),
        to,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      }),
      SEND_TIMEOUT_MS,
    );
    await emailRepository.markSent(log._id, info?.messageId);
    return { status: "sent", logId: String(log._id) };
  } catch (err) {
    console.error(`[email] send failed (${log.type} → ${to}):`, err?.message || err);
    await emailRepository.markFailed(log._id, err?.message);
    return { status: "failed", logId: String(log._id), reason: err?.message };
  }
};

/**
 * Send one email.
 *
 * @param {object}  opts
 * @param {string}  opts.to           recipient address
 * @param {string}  opts.type         template key, also stored on the log row
 * @param {object}  opts.data         template payload
 * @param {string}  [opts.recipient]  User _id, for log attribution
 * @param {string}  [opts.dedupeKey]  stable key for at-most-once sends
 * @param {boolean} [opts.optedOut]   caller-resolved opt-out flag
 * @returns {Promise<{status: string, logId?: string, reason?: string}>}
 */
const sendEmail = async ({
  to,
  type,
  data = {},
  recipient = null,
  dedupeKey = null,
  optedOut = false,
}) => {
  if (!to) return { status: "failed", reason: "no recipient address" };

  let rendered;
  try {
    rendered = render(type, data);
  } catch (err) {
    console.error(`[email] ${err.message}`);
    return { status: "failed", reason: err.message };
  }

  // Rows start as skipped_not_configured and are corrected by `deliver`, so a
  // crash mid-send leaves an honest "we never confirmed this went out" record
  // rather than a false "sent".
  const row = {
    to,
    recipient,
    type,
    subject: rendered.subject,
    dedupeKey: dedupeKey || null,
    status: "skipped_not_configured",
  };

  let log;
  if (dedupeKey) {
    // Claim before doing any work: a duplicate key means another run already
    // owns this send, so we stop rather than double-send.
    log = await emailRepository.claim(row);
    if (!log) return { status: "duplicate", reason: "already sent" };
  } else {
    log = await emailRepository.create(row);
  }

  return deliver(log, rendered, { to, optedOut });
};

/**
 * Send against a log row the caller already claimed via
 * `emailRepository.claim`. Used when a single dedupe claim has to gate more
 * than just the email.
 */
const sendClaimed = async (log, { to, type, data = {}, optedOut = false }) => {
  let rendered;
  try {
    rendered = render(type, data);
  } catch (err) {
    console.error(`[email] ${err.message}`);
    await emailRepository.markFailed(log._id, err.message);
    return { status: "failed", logId: String(log._id), reason: err.message };
  }
  return deliver(log, rendered, { to, optedOut });
};

/**
 * Send a batch with bounded concurrency.
 *
 * Serial sending is too slow for a 200-teacher broadcast; unbounded parallel
 * sending trips SMTP rate limits and connection caps. A small pool is the
 * middle ground. Results come back in input order.
 */
const sendBatch = async (messages, { concurrency = 5 } = {}) => {
  const results = new Array(messages.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < messages.length) {
      const index = cursor++;
      results[index] = await sendEmail(messages[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, messages.length) }, worker),
  );

  return results;
};

/** Roll up a batch of results into countable buckets. */
const summarize = (results) =>
  results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

/** Render without sending — powers the compose-screen preview. */
const preview = (type, data = {}) => render(type, data);

module.exports = { sendEmail, sendClaimed, sendBatch, summarize, preview };
