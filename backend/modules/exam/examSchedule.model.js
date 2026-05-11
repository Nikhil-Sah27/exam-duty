const mongoose = require("mongoose");

const examScheduleSchema = new mongoose.Schema(
  {
    examGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamGroup",
      required: [true, "Exam group is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^\d{2}:\d{2}$/, "End time must be in HH:MM format"],
    },
  },
  { timestamps: true }
);

examScheduleSchema.index({ examGroup: 1, date: 1 });

module.exports = mongoose.model("ExamSchedule", examScheduleSchema);
