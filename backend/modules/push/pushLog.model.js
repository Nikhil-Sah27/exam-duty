const mongoose = require("mongoose");

/**
 * Audit + idempotency record for every outbound push notification.
 *
 * A separate collection from EmailLog / WhatsAppLog for the same reason those
 * two are separate from each other: the channels fail independently, and a
 * revoked Expo credential must not stop the email going out.
 *
 * One row per *device*, not per user. Push is the only channel that fans out
 * — one notification for a teacher with a phone and a tablet is two delivery
 * attempts with two independent outcomes, and rolling them into one row would
 * hide the device that stopped receiving.
 *
 * `unregistered` is this channel's own status: Expo replied `DeviceNotRegistered`,
 * meaning the app was uninstalled or the token rotated, and the token has been
 * deleted. It is not a failure to retry — it is a device that no longer exists.
 */
const pushLogSchema = new mongoose.Schema(
  {
    // The Expo push token this attempt addressed.
    to: {
      type: String,
      required: true,
      trim: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["ios", "android", "web", "unknown"],
      default: "unknown",
    },
    title: {
      type: String,
      default: null,
    },
    body: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "sent",
        "failed",
        "skipped_not_configured",
        "skipped_opted_out",
        "skipped_invalid_token",
        "unregistered",
      ],
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
    // Expo push *ticket* id. A ticket is an acceptance, not a delivery — the
    // receipt endpoint is what confirms delivery, 15 minutes later.
    ticketId: {
      type: String,
      default: null,
    },
    dedupeKey: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Partial unique index — only rows that carry a dedupeKey are constrained,
// so unkeyed one-off rows pile up freely.
pushLogSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);
pushLogSchema.index({ recipient: 1, createdAt: -1 });
pushLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("PushLog", pushLogSchema);
