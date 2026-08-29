const mongoose = require("mongoose");

/**
 * Audit + idempotency record for every outbound email.
 *
 * `dedupeKey` is the idempotency guard. Any send that must happen at most
 * once (duty reminders, which a 15-minute cron re-evaluates repeatedly)
 * passes a stable key; the unique partial index then makes a second attempt
 * a no-op instead of a duplicate inbox entry. One-off sends (admin broadcast)
 * pass no key and are exempt from the index.
 */
const emailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped_not_configured", "skipped_opted_out"],
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
    messageId: {
      type: String,
      default: null,
    },
    // Stable key for at-most-once sends. Absent for one-off sends.
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

// Partial unique index — only documents that actually carry a dedupeKey are
// constrained, so unkeyed broadcast rows can pile up freely.
emailLogSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);
emailLogSchema.index({ recipient: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);
