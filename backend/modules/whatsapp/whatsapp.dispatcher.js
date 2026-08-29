const mongoose = require("mongoose");
const User = require("../auth/auth.model");
const whatsappService = require("./whatsapp.service");

/**
 * Bridge from in-app notifications to WhatsApp — the mirror of
 * email.dispatcher.js, hanging off the same emitter so callers stay unaware
 * of how many channels exist.
 */

// Types that also go out on WhatsApp. Any type absent here skips the channel.
const WHATSAPPABLE_TYPES = new Set([
  "duty_assigned",
  "duty_cancelled",
  "duty_swapped",
  "exam_deleted_duty_release",
  "request_submitted",
  "request_approved",
  "request_rejected",
  "admin_message",
]);

const isWhatsAppable = (type) => WHATSAPPABLE_TYPES.has(type);

/** In-app payloads use `room`; the WhatsApp templates want `roomLabel`. */
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
      `[whatsapp] skipping ${unusable.length} unusable recipient id(s): ${unusable.join(", ")}`,
    );
  }
  if (!usable.length) return new Map();

  const users = await User.find({ _id: { $in: usable } })
    .select("name phone whatsappNotifications")
    .lean();

  return new Map(users.map((u) => [String(u._id), u]));
};

/**
 * Dispatch WhatsApp for a batch of already-persisted notifications.
 * Never throws — invoked fire-and-forget after a committed write.
 */
const dispatch = async (notifications) => {
  const eligible = (notifications || []).filter((n) => isWhatsAppable(n.type));
  if (!eligible.length) return {};

  try {
    const userMap = await loadRecipients(eligible.map((n) => n.recipient));

    const messages = [];
    for (const n of eligible) {
      const user = userMap.get(toId(n.recipient));
      // No phone on file — nothing to address. The in-app notification and
      // the email have already gone, so this is not a lost message.
      if (!user?.phone) continue;

      messages.push({
        to: user.phone,
        type: n.type,
        recipient: user._id,
        optedOut: user.whatsappNotifications === false,
        data: { name: user.name, ...normalize(n.type, n.data) },
      });
    }

    if (!messages.length) return {};

    const results = await whatsappService.sendBatch(messages);
    const summary = whatsappService.summarize(results);

    if (summary.failed) {
      console.error(
        `[whatsapp] ${summary.failed} of ${messages.length} notification messages failed`,
      );
    }
    return summary;
  } catch (err) {
    console.error("[whatsapp] dispatch failed:", err?.message || err);
    return { failed: eligible.length };
  }
};

module.exports = { dispatch, isWhatsAppable, WHATSAPPABLE_TYPES };
