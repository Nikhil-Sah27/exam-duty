const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "duty_assigned",
        "duty_cancelled",
        "request_submitted",
        "request_approved",
        "request_rejected",
        "duty_swapped",
        "exam_deleted_duty_release",
        // Scheduled "your duty is coming up" reminder.
        "duty_reminder",
        // Free-text message composed by CS and broadcast to a role/department.
        "admin_message",
      ],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    // Optional reference to the entity that triggered the notification
    refModel: {
      type: String,
      enum: ["Duty", "ChangeRequest"],
      default: null,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Set only for admin_message — who composed the broadcast. Lets the UI
    // attribute the message and lets CS audit what was sent.
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    /**
     * At-most-once key for generated notifications (duty reminders). Absent
     * for everything a human action produced — those may legitimately repeat.
     * The partial unique index below is what makes the reminder job safe to
     * re-run without producing a second copy in the bell.
     */
    dedupeKey: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Only documents that actually carry a dedupeKey are constrained, so the
// unkeyed majority is unaffected.
notificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);

module.exports = mongoose.model("Notification", notificationSchema);
