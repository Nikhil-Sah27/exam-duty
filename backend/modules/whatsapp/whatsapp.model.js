const mongoose = require("mongoose");

/**
 * Audit + idempotency record for every outbound WhatsApp message.
 *
 * Deliberately a separate collection from EmailLog rather than a shared
 * "delivery" table: the two channels fail independently, and a WhatsApp
 * session dropping must never stop the email going out (or vice versa).
 * Each channel therefore owns its own dedupe key and its own claim.
 */
const whatsappLogSchema = new mongoose.Schema(
  {
    // E.164, stored in full — the masked form is derived for display.
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
    // Which adapter handled it — useful when diagnosing a provider switch.
    provider: {
      type: String,
      enum: ["cloud_api", "webjs", "none"],
      default: "none",
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
        "skipped_invalid_number",
      ],
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
    // Provider-side id (Meta wamid, or whatsapp-web.js message id).
    messageId: {
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

whatsappLogSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);
whatsappLogSchema.index({ recipient: 1, createdAt: -1 });
whatsappLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("WhatsAppLog", whatsappLogSchema);
