const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    roles: {
      type: [
        {
          type: String,
          enum: ["cs", "dcs", "rs", "invigilator"],
        },
      ],
      default: ["invigilator"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "User must have at least one role",
      },
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Per-user channel opt-outs. In-app notifications are always delivered;
    // these only gate the email, WhatsApp and push copies, so switching any of
    // them off never hides a duty change from the user inside the app.
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    whatsappNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Exclude soft-deleted users from all find queries by default
userSchema.pre(/^find/, function () {
  if (this.getFilter().isActive === undefined) {
    this.where({ isActive: true });
  }
});

module.exports = mongoose.model("User", userSchema);
