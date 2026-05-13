const mongoose = require("mongoose");

const dutySchema = new mongoose.Schema(
  {
    // Legacy reference to the single-exam model. Optional now — duties created
    // from the new ExamGroup/ExamSchedule flow set `examSchedule` + `examRoom`
    // instead. Validation that at least one path is present lives in the
    // service layer, since Mongoose doesn't express OR-required cleanly.
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      default: null,
    },
    examSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSchedule",
      default: null,
    },
    examRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamRoom",
      default: null,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    room: {
      type: String,
      required: [true, "Room is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Duty date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^\d{2}:\d{2}$/, "Use HH:MM format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^\d{2}:\d{2}$/, "Use HH:MM format"],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isSelfAssigned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["assigned", "completed", "cancelled"],
      default: "assigned",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index — one teacher per time slot, one room per time slot
dutySchema.index({ teacher: 1, date: 1, startTime: 1, status: 1 });
dutySchema.index({ room: 1, date: 1, startTime: 1, status: 1 });

module.exports = mongoose.model("Duty", dutySchema);
