const pushRepository = require("./push.repository");
const { templates } = require("./push.templates");

/**
 * Outbound push via the Expo Push API, with a PushLog row for every attempt.
 *
 * Same two rules as the email and WhatsApp services, for the same reasons:
 *   1. Sending NEVER throws into the caller. A revoked Expo credential must
 *      not fail a duty assignment that already committed; failures land in
 *      PushLog with status `failed`.
 *   2. Every attempt is recorded — including the ones skipped because push is
 *      switched off, the user opted out, or the stored token is malformed.
 *
 * What is different about this channel:
 *
 *   • It fans out. A teacher with a phone and a tablet is two delivery
 *     attempts, so the unit of work here is a *device*, not a user. `sendToUser`
 *     resolves the devices; everything below it deals in tokens.
 *
 *   • The API is batched, not per-message: up to 100 messages per request. So
 *     unlike the SMTP/WhatsApp services there is no concurrency pool — the
 *     batching is the parallelism.
 *
 *   • A 200 does NOT mean delivered. Expo answers with one *ticket* per
 *     message, in request order, and a ticket can carry `status: "error"`
 *     inside an otherwise successful response. Every ticket is inspected.
 *
 *   • `DeviceNotRegistered` deletes the token. This is the hygiene that keeps
 *     the channel healthy: an uninstalled app's token is valid-looking
 *     forever, and without pruning every future batch carries messages that
 *     can never arrive, eating the per-project rate limit.
 */

const EXPO_SEND_URL = "https://exp.host/--/api/v2/push/send";

// Expo's documented maximum messages per request.
const CHUNK_SIZE = 100;
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Push needs no credentials — the Expo push service accepts anonymous sends,
 * and EXPO_ACCESS_TOKEN only matters once push security is enabled on the
 * project. So "configured" here means "not switched off", and the channel is
 * on by default. With no devices registered it still sends nothing, so a
 * deployment that never ships the mobile app is unaffected either way.
 */
const isEnabled = () => process.env.PUSH_ENABLED !== "false";
const isConfigured = () => isEnabled();

// Mirrors Expo's own `Expo.isExpoPushToken`. Rejecting at registration is what
// keeps junk out of a batch — one bad token does not fail the request, but it
// does consume a slot and produce a ticket error every single send.
const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]]+\]$/;
const UUID_PATTERN = /^[a-z\d]{8}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{12}$/i;

const isExpoPushToken = (token) =>
  typeof token === "string" &&
  (EXPO_TOKEN_PATTERN.test(token) || UUID_PATTERN.test(token));

/** A push token is a capability — anyone holding it can push to that device. */
const maskToken = (token) => {
  const str = String(token ?? "");
  if (str.length <= 12) return "***";
  return `${str.slice(0, 8)}…${str.slice(-5)}`;
};

const render = (type, data) => {
  const build = templates[type];
  if (!build) throw new Error(`unknown push template "${type}"`);
  return build(data);
};

/**
 * POST one chunk of ≤100 messages.
 *
 * @returns {Promise<{ok: true, tickets: object[]} | {ok: false, error: string}>}
 * Never throws — the caller reconciles the log rows either way.
 */
const postChunk = async (messages) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = {
      accept: "application/json",
      "accept-encoding": "gzip, deflate",
      "content-type": "application/json",
    };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const res = await fetch(EXPO_SEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
      signal: controller.signal,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Request-level failure: Expo puts the useful part in `errors`.
      const detail = json?.errors?.[0]?.message || json?.error || `HTTP ${res.status}`;
      return { ok: false, error: String(detail) };
    }

    const tickets = Array.isArray(json?.data) ? json.data : [];
    // Tickets are positional. If the counts disagree we cannot say which
    // message any ticket belongs to, so the honest answer is that the whole
    // chunk is unconfirmed rather than a guessed-at alignment.
    if (tickets.length !== messages.length) {
      return {
        ok: false,
        error: `Expo returned ${tickets.length} tickets for ${messages.length} messages`,
      };
    }

    return { ok: true, tickets };
  } catch (err) {
    const reason =
      err.name === "AbortError"
        ? `request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : err.message;
    return { ok: false, error: reason };
  } finally {
    clearTimeout(timer);
  }
};

/** Reconcile one log row against the ticket Expo returned for it. */
const reconcile = async (entry, ticket) => {
  if (ticket?.status === "ok") {
    await pushRepository.markSent(entry.log._id, ticket.id);
    return { status: "sent", logId: String(entry.log._id), ticketId: ticket.id || null };
  }

  const code = ticket?.details?.error || null;
  const message = ticket?.message || code || "unknown ticket error";

  if (code === "DeviceNotRegistered") {
    // The app was uninstalled or the token rotated. Drop it now — this is the
    // only signal Expo ever gives that a device is gone.
    await pushRepository.removeDeadToken(entry.to);
    await pushRepository.markUnregistered(entry.log._id, message);
    console.warn(`[push] removed unregistered token ${maskToken(entry.to)} (${entry.log.type})`);
    return { status: "unregistered", logId: String(entry.log._id), reason: message };
  }

  console.error(`[push] send failed (${entry.log.type} → ${maskToken(entry.to)}): ${message}`);
  await pushRepository.markFailed(entry.log._id, message);
  return { status: "failed", logId: String(entry.log._id), reason: message };
};

/**
 * Send a batch of per-device messages.
 *
 * @param {Array<object>} messages
 * @param {string}  messages[].to          Expo push token
 * @param {string}  messages[].type        template key, also stored on the log row
 * @param {object}  messages[].data        template payload
 * @param {string}  [messages[].recipient] User _id, for log attribution
 * @param {string}  [messages[].platform]  ios | android | web
 * @param {string}  [messages[].dedupeKey] stable key for at-most-once sends
 * @param {boolean} [messages[].optedOut]  caller-resolved opt-out flag
 * @returns {Promise<Array<{status: string, logId?: string, reason?: string}>>}
 *          one result per input message, in input order.
 */
const sendBatch = async (messages) => {
  const results = new Array(messages.length);
  const pending = [];

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];

    let rendered;
    try {
      rendered = render(message.type, message.data || {});
    } catch (err) {
      console.error(`[push] ${err.message}`);
      results[i] = { status: "failed", reason: err.message };
      continue;
    }

    // Rows start as skipped_not_configured and are corrected below, so a
    // crash mid-send leaves an honest "never confirmed" record, not a false
    // "sent". Same convention as the email service.
    const row = {
      to: String(message.to ?? "").slice(0, 200) || "(none)",
      recipient: message.recipient || null,
      type: message.type,
      platform: message.platform || "unknown",
      title: rendered.title,
      body: rendered.body,
      dedupeKey: message.dedupeKey || null,
      status: "skipped_not_configured",
    };

    let log;
    if (message.dedupeKey) {
      // Claim before doing any work: a duplicate key means another run
      // already owns this send, so we stop rather than double-notify.
      log = await pushRepository.claim(row);
      if (!log) {
        results[i] = { status: "duplicate", reason: "already sent" };
        continue;
      }
    } else {
      log = await pushRepository.create(row);
    }

    if (!isExpoPushToken(message.to)) {
      await pushRepository.markSkipped(log._id, "skipped_invalid_token");
      results[i] = { status: "skipped_invalid_token", logId: String(log._id) };
      continue;
    }

    if (message.optedOut) {
      await pushRepository.markSkipped(log._id, "skipped_opted_out");
      results[i] = { status: "skipped_opted_out", logId: String(log._id) };
      continue;
    }

    if (!isConfigured()) {
      // The row was created as skipped_not_configured — leave it.
      results[i] = { status: "skipped_not_configured", logId: String(log._id) };
      continue;
    }

    pending.push({
      index: i,
      to: message.to,
      log,
      expo: {
        to: message.to,
        title: rendered.title,
        body: rendered.body,
        data: rendered.data,
        sound: "default",
        priority: "high",
      },
    });
  }

  // Chunks run one after another rather than in parallel: Expo rate-limits per
  // project, and 100 recipients per round trip is already fast enough for a
  // full-department broadcast.
  for (let start = 0; start < pending.length; start += CHUNK_SIZE) {
    const chunk = pending.slice(start, start + CHUNK_SIZE);
    const outcome = await postChunk(chunk.map((entry) => entry.expo));

    if (!outcome.ok) {
      console.error(`[push] batch of ${chunk.length} failed: ${outcome.error}`);
      for (const entry of chunk) {
        await pushRepository.markFailed(entry.log._id, outcome.error);
        results[entry.index] = {
          status: "failed",
          logId: String(entry.log._id),
          reason: outcome.error,
        };
      }
      continue;
    }

    for (let j = 0; j < chunk.length; j += 1) {
      results[chunk[j].index] = await reconcile(chunk[j], outcome.tickets[j]);
    }
  }

  return results;
};

/** Roll up a batch of results into countable buckets. */
const summarize = (results) =>
  results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

/** Send one message to one device. */
const sendPush = async (message) => (await sendBatch([message]))[0];

/**
 * Send to every device a user has registered.
 *
 * This is the entry point for callers that think in users rather than devices
 * — the reminder job among them. The at-most-once unit is (notification,
 * device), so a caller's user-level `dedupeKey` is suffixed with the token
 * before it is claimed. That keeps a re-run of the reminder cron from
 * double-notifying any device, which is the property the claim exists for,
 * without one device's row silently gating the user's other devices.
 *
 * Never throws.
 */
const sendToUser = async ({ userId, type, data = {}, dedupeKey = null, optedOut = false }) => {
  const devices = await pushRepository.findTokensForUsers([userId]);
  // No device registered — nothing to address. The in-app notification has
  // already landed, so this is not a lost message.
  if (!devices.length) return { status: "no_device", devices: 0, counts: {} };

  const results = await sendBatch(
    devices.map((device) => ({
      to: device.token,
      type,
      data,
      recipient: userId,
      platform: device.platform,
      optedOut,
      dedupeKey: dedupeKey ? `${dedupeKey}#${device.token}` : null,
    })),
  );

  const counts = summarize(results);
  // One rolled-up word for the caller's own log, with the per-device detail
  // still available underneath.
  const status = results.some((r) => r.status === "sent") ? "sent" : results[0].status;

  return { status, devices: results.length, counts, results };
};

/** Every registered device for a set of users, for the dispatcher's fan-out. */
const devicesForUsers = (userIds) => pushRepository.findTokensForUsers(userIds);

/** Render without sending — powers the compose-screen preview. */
const preview = (type, data = {}) => render(type, data);

module.exports = {
  sendPush,
  sendBatch,
  sendToUser,
  devicesForUsers,
  summarize,
  preview,
  isConfigured,
  isExpoPushToken,
  maskToken,
};
