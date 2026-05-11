const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Semester name is required"],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    studentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

semesterSchema.index({ department: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Semester", semesterSchema);
