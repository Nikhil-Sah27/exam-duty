const pushService = require("./push.service");
const pushRepository = require("./push.repository");
const User = require("../auth/auth.model");
const catchAsync = require("../../shared/utils/catchAsync");
const AppError = require("../../shared/utils/AppError");

const PLATFORMS = new Set(["ios", "android", "web"]);

/**
 * Register the calling device.
 *
 * Every signed-in user registers their own device — this is not a CS
 * operation. The owner comes from the JWT, never the body, so a request
 * cannot point someone else's notifications at this handset.
 *
 * Idempotent: the same device calling on every app launch keeps one row and
 * refreshes `lastSeenAt`.
 */
const registerToken = catchAsync(async (req, res) => {
  const { token, platform, deviceName } = req.body || {};
  if (!token) throw new AppError("token is required", 400);

  // Rejected here rather than at send time: a malformed token in the registry
  // produces a ticket error on every future batch and never a delivery.
  if (!pushService.isExpoPushToken(token)) {
    throw new AppError("That is not a valid Expo push token", 400);
  }

  const normalizedPlatform = String(platform || "").toLowerCase();
  const device = await pushRepository.registerToken({
    user: req.user.id,
    token,
    platform: PLATFORMS.has(normalizedPlatform) ? normalizedPlatform : "unknown",
    deviceName,
  });

  res.status(200).json({
    success: true,
    data: {
      registered: true,
      token: pushService.maskToken(device.token),
      platform: device.platform,
      deviceName: device.deviceName,
      lastSeenAt: device.lastSeenAt,
    },
  });
});

/**
 * Deregister on sign-out. Scoped to the caller, so signing out of a shared
 * device only removes it if it is still registered to them — a second teacher
 * who has since signed in keeps their registration.
 *
 * Idempotent: deregistering an unknown token is a 200, not a 404. The app
 * calls this while tearing down and has nothing useful to do with an error.
 */
const deregisterToken = catchAsync(async (req, res) => {
  const { token } = req.body || {};
  if (!token) throw new AppError("token is required", 400);

  const result = await pushRepository.removeToken(token, req.user.id);

  res.status(200).json({
    success: true,
    data: { removed: result.deletedCount > 0 },
  });
});

/** Channel state + registered device count + a 7-day rollup of what was sent. */
const health = catchAsync(async (req, res) => {
  const [devices, byPlatform, counts] = await Promise.all([
    pushRepository.countTokens(),
    pushRepository.countTokensByPlatform(),
    pushRepository.countByStatus(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  ]);

  res.status(200).json({
    success: true,
    data: {
      configured: pushService.isConfigured(),
      accessToken: Boolean(process.env.EXPO_ACCESS_TOKEN),
      devices,
      devicesByPlatform: byPlatform,
      pushesLast7Days: counts,
    },
  });
});

/**
 * Send a real push to one user's devices, to confirm the pipe works end to
 * end before relying on it. Unkeyed, so it can be repeated.
 */
const testSend = catchAsync(async (req, res) => {
  const { userId, message } = req.body || {};
  if (!userId) throw new AppError("userId is required", 400);

  const user = await User.findById(userId).select("name pushNotifications").lean();
  if (!user) throw new AppError("User not found", 404);

  const result = await pushService.sendToUser({
    userId: user._id,
    type: "admin_message",
    optedOut: user.pushNotifications === false,
    data: {
      name: user.name,
      title: "Exam Duty test",
      message:
        message ||
        "Test push from the Exam Duty system. If you see this, push notifications work.",
    },
  });

  if (result.status === "no_device") {
    throw new AppError("That user has no device registered for push", 400);
  }

  res.status(200).json({
    success: true,
    data: { status: result.status, devices: result.devices, counts: result.counts },
  });
});

module.exports = { registerToken, deregisterToken, health, testSend };
