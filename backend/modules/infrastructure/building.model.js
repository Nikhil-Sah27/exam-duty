const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Building name is required"],
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Building", buildingSchema);
