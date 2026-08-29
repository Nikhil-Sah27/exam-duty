const mongoose = require("mongoose");
const User = require("../auth/auth.model");
const emailService = require("./email.service");

/**
 * Bridge from in-app notifications to email.
 *
 * The notification emitter is already the single funnel every module uses to
 * tell someone something, so email hangs off that same funnel rather than
 * asking every caller to remember a second step. Callers keep emitting
 * exactly as before; this module decides what also deserves an inbox copy.
 *
 * Notification `data` payloads were shaped for the in-app templates, which
 * are terser than the email ones. `normalize` widens them — filling what it
 * can, leaving the rest absent — so email templates degrade to a shorter
 * detail table instead of printing "undefined".
 */

// Types that also go out by email. A type absent here is in-app only.
const EMAILABLE_TYPES = new Set([
  "duty_assigned",
  "duty_cancelled",
  "duty_swapped",
  "exam_deleted_duty_release",
  "request_submitted",
  "request_approved",
  "request_rejected",
  "admin_message",
]);

const isEmailable = (type) => EMAILABLE_TYPES.has(type);

/**
 * Map an in-app notification payload onto the email template's fields.
 * `room` (in-app, a bare room number) becomes `roomLabel`; everything the
 * email template understands is passed through when the caller supplied it.
 */
const normalize = (type, data = {}) => ({
  ...data,
  roomLabel: data.roomLabel || data.room || null,
});

// Callers may hand us a populated user document where an id is expected.
const toId = (recipient) => String(recipient?._id || recipient);

/** Fetch address + display name + opt-out for a set of user ids, in one query. */
const loadRecipients = async (userIds) => {
  const ids = [...new Set(userIds.filter(Boolean).map(toId))];
  // A single uncastable id would make the whole $in query throw, dropping the
  // batch's valid recipients along with the bad one — so drop only the bad one.
  const usable = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (usable.length !== ids.length) {
    const unusable = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    console.error(
      `[email] skipping ${unusable.length} unusable recipient id(s): ${unusable.join(", ")}`,
    );
  }
  if (!usable.length) return new Map();

  const users = await User.find({ _id: { $in: usable } })
    .select("name email emailNotifications")
    .lean();

  return new Map(users.map((u) => [String(u._id), u]));
};

/**
 * Dispatch email for a batch of already-persisted notifications.
 *
 * @param {Array<{type, recipient, data}>} notifications
 * @returns {Promise<object>} status counts, for logging
 *
 * Never throws — it is invoked fire-and-forget after a committed write.
 */
const dispatch = async (notifications) => {
  const emailable = (notifications || []).filter((n) => isEmailable(n.type));
  if (!emailable.length) return {};

  try {
    const userMap = await loadRecipients(emailable.map((n) => n.recipient));

    const messages = [];
    for (const n of emailable) {
      const user = userMap.get(toId(n.recipient));
      // No user row or no address on file — nothing to send to. The in-app
      // notification still landed, so this is not a lost message.
      if (!user?.email) continue;

      messages.push({
        to: user.email,
        type: n.type,
        recipient: user._id,
        optedOut: user.emailNotifications === false,
        data: { name: user.name, ...normalize(n.type, n.data) },
      });
    }

    if (!messages.length) return {};

    const results = await emailService.sendBatch(messages);
    const summary = emailService.summarize(results);

    if (summary.failed) {
      console.error(`[email] ${summary.failed} of ${messages.length} notification emails failed`);
    }
    return summary;
  } catch (err) {
    console.error("[email] dispatch failed:", err?.message || err);
    return { failed: emailable.length };
  }
};

module.exports = { dispatch, isEmailable, EMAILABLE_TYPES };
