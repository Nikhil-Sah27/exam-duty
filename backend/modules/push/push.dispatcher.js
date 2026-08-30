const mongoose = require("mongoose");
const User = require("../auth/auth.model");
const pushService = require("./push.service");

/**
 * Bridge from in-app notifications to push — the mirror of
 * email.dispatcher.js and whatsapp.dispatcher.js, hanging off the same
 * emitter so callers stay unaware of how many channels exist.
 *
 * The one structural difference: email and WhatsApp address a user through a
 * single field on the user row, while push addresses *devices*. One
 * notification for a teacher with a phone and a tablet becomes two messages,
 * so the fan-out happens here, before the batch is handed to the service.
 */

// Types that also go out as a push. Any type absent here skips the channel.
// Deliberately the same set as the other two channels: a notification worth
// an inbox copy is worth a lock-screen copy, and a channel that quietly
// covered a different set of events would be impossible to reason about.
// `duty_reminder` is absent from all three — it goes out through the reminder
// job, which owns its own at-most-once claim.
const PUSHABLE_TYPES = new Set([
  "duty_assigned",
  "duty_cancelled",
  "duty_swapped",
  "exam_deleted_duty_release",
  "request_submitted",
  "request_approved",
  "request_rejected",
  "admin_message",
]);

const isPushable = (type) => PUSHABLE_TYPES.has(type);

/** In-app payloads use `room`; the push templates want `roomLabel`. */
const normalize = (type, data = {}) => ({
  ...data,
  roomLabel: data.roomLabel || data.room || null,
});

// Callers may hand us a populated user document where an id is expected.
const toId = (recipient) => String(recipient?._id || recipient);

const loadRecipients = async (userIds) => {
  const ids = [...new Set(userIds.filter(Boolean).map(toId))];
  // A single uncastable id would make the whole $in query throw, dropping the
  // batch's valid recipients along with the bad one — so drop only the bad one.
  const usable = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (usable.length !== ids.length) {
    const unusable = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    console.error(
      `[push] skipping ${unusable.length} unusable recipient id(s): ${unusable.join(", ")}`,
    );
  }
  if (!usable.length) return new Map();

  const users = await User.find({ _id: { $in: usable } })
    .select("name pushNotifications")
    .lean();

  return new Map(users.map((u) => [String(u._id), u]));
};

/** Group a flat device list by owner, so each notification fans out in one lookup. */
const groupByUser = (devices) => {
  const byUser = new Map();
  for (const device of devices) {
    const key = String(device.user);
    const list = byUser.get(key);
    if (list) list.push(device);
    else byUser.set(key, [device]);
  }
  return byUser;
};

/**
 * Dispatch push for a batch of already-persisted notifications.
 * Never throws — invoked fire-and-forget after a committed write.
 */
const dispatch = async (notifications) => {
  const eligible = (notifications || []).filter((n) => isPushable(n.type));
  if (!eligible.length) return {};

  try {
    const userMap = await loadRecipients(eligible.map((n) => n.recipient));
    if (!userMap.size) return {};

    const devices = await pushService.devicesForUsers([...userMap.keys()]);
    const devicesByUser = groupByUser(devices);

    const messages = [];
    for (const n of eligible) {
      const user = userMap.get(toId(n.recipient));
      if (!user) continue;

      // No device registered — nothing to address. The in-app notification
      // and the email have already gone, so this is not a lost message.
      const owned = devicesByUser.get(String(user._id)) || [];
      const data = { name: user.name, ...normalize(n.type, n.data) };

      for (const device of owned) {
        messages.push({
          to: device.token,
          type: n.type,
          recipient: user._id,
          platform: device.platform,
          optedOut: user.pushNotifications === false,
          data,
        });
      }
    }

    if (!messages.length) return {};

    const results = await pushService.sendBatch(messages);
    const summary = pushService.summarize(results);

    if (summary.failed) {
      console.error(
        `[push] ${summary.failed} of ${messages.length} notification pushes failed`,
      );
    }
    return summary;
  } catch (err) {
    console.error("[push] dispatch failed:", err?.message || err);
    return { failed: eligible.length };
  }
};

module.exports = { dispatch, isPushable, PUSHABLE_TYPES };
