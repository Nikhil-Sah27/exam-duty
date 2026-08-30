const mongoose = require("mongoose");

/**
 * One Expo push token per device, owned by whoever is signed in on it.
 *
 * The token *is* the device key. Expo issues exactly one per app
 * installation and returns the same string on every subsequent
 * `getExpoPushTokenAsync` call, so a unique index on `token` is what stops an
 * app that registers on every launch from accumulating a row per launch.
 * There is nothing better to key on: `expo-device` exposes model and OS build,
 * neither of which is unique to a handset.
 *
 * `user` is therefore mutable rather than part of the key. A shared
 * department tablet keeps its token when a second teacher signs in, and
 * re-registering reassigns the row — which is exactly what must happen, or
 * the previous owner keeps receiving that device's duty pushes.
 *
 * `lastSeenAt` is refreshed on every registration. A token that has not been
 * seen for months is a device that stopped opening the app, which is how a
 * dead device is reasoned about before Expo ever reports it unregistered.
 */
const pushTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // "ExponentPushToken[…]", "ExpoPushToken[…]", or a bare UUID.
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    platform: {
      type: String,
      enum: ["ios", "android", "web", "unknown"],
      default: "unknown",
    },
    // Free text from the device, for the "which phone is this?" question.
    deviceName: {
      type: String,
      trim: true,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

pushTokenSchema.index({ user: 1, lastSeenAt: -1 });

module.exports = mongoose.model("PushToken", pushTokenSchema);
