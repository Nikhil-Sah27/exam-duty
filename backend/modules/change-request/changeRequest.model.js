const mongoose = require("mongoose");

const changeRequestSchema = new mongoose.Schema(
  {
    // Distinguishes a per-duty (invigilator) request from a per-group (DCS)
    // request. DCS users supervise a whole bundle of rooms — the unit of
    // change is the DCSGroup, never an individual classroom.
    scope: {
      type: String,
      enum: ["duty", "dcs_group"],
      default: "duty",
    },
    duty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Duty",
      // Required only for per-duty scope. DCS group swaps don't reference a
      // single duty — they move the whole group's duties together at approval
      // time. Service layer enforces the scope-specific requirement.
      required: false,
      default: null,
    },
    // DCS group refs. Populated only when scope === "dcs_group".
    dcsSourceGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DCSGroup",
      default: null,
    },
    dcsTargetGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DCSGroup",
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: [true, "Request type is required"],
      enum: ["swap", "drop", "move", "dcs_swap"],
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
    // For move requests — the target ExamSchedule + ExamRoom + time/room
    // (Required at the service layer when type === "move"; not at schema layer
    // so swap/drop requests don't need to provide them.)
    requestedSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSchedule",
      default: null,
    },
    requestedExamRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamRoom",
      default: null,
    },
    requestedRoom: {
      type: String,
      trim: true,
      default: null,
    },
    requestedDate: {
      type: Date,
      default: null,
    },
    requestedStartTime: {
      type: String,
      match: [/^\d{2}:\d{2}$/, "Use HH:MM format"],
      default: null,
    },
    requestedEndTime: {
      type: String,
      match: [/^\d{2}:\d{2}$/, "Use HH:MM format"],
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled_exam_deleted"],
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

// One pending request per duty per teacher (per-duty scope).
changeRequestSchema.index(
  { duty: 1, requestedBy: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending", scope: "duty" },
  }
);

// One pending DCS swap per source group per teacher — the DCS analogue of the
// rule above. Indexed on source group + requester so the same DCS can't queue
// two swaps for the same group.
changeRequestSchema.index(
  { dcsSourceGroup: 1, requestedBy: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending", scope: "dcs_group" },
  }
);

module.exports = mongoose.model("ChangeRequest", changeRequestSchema);
