const mongoose = require("mongoose");

const changeRequestSchema = new mongoose.Schema(
  {
    duty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Duty",
      required: [true, "Duty is required"],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: [true, "Request type is required"],
      enum: ["swap", "drop"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },
    // For swap requests — the teacher willing to take over
    swapWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// One pending request per duty per teacher
changeRequestSchema.index(
  { duty: 1, requestedBy: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("ChangeRequest", changeRequestSchema);
