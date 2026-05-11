const mongoose = require("mongoose");

const ciePlanEntrySchema = new mongoose.Schema(
  {
    examGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamGroup",
      required: [true, "Exam group is required"],
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSchedule",
      required: [true, "Schedule is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
  },
  { timestamps: true }
);

ciePlanEntrySchema.index(
  { examGroup: 1, schedule: 1, department: 1 },
  { unique: true }
);

module.exports = mongoose.model("CIEPlanEntry", ciePlanEntrySchema);
