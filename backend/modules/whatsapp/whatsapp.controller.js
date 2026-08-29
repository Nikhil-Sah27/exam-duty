const QRCode = require("qrcode");
const providers = require("./providers");
const whatsappService = require("./whatsapp.service");
const whatsappRepository = require("./whatsapp.repository");
const phone = require("./phone.utils");
const User = require("../auth/auth.model");
const catchAsync = require("../../shared/utils/catchAsync");
const AppError = require("../../shared/utils/AppError");

/** Provider state + reachability + a 7-day rollup of what was sent. */
const health = catchAsync(async (req, res) => {
  const provider = providers.get();
  const [verify, counts] = await Promise.all([
    provider.verify(),
    whatsappRepository.countByStatus(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  ]);

  res.status(200).json({
    success: true,
    data: {
      provider: provider.name,
      status: provider.status(),
      verify,
      messagesLast7Days: counts,
      defaultCountryCode: phone.DEFAULT_CC(),
    },
  });
});

/**
 * The pending QR for linking a whatsapp-web.js session.
 *
 * Rendered server-side into a data-URL PNG as well as returned raw. Linking
 * otherwise means reading the QR out of the server's stdout, which on a
 * deployed box means digging through CloudWatch — workable, but not something
 * to ask of whoever is holding the phone. Only the webjs provider has one;
 * the Cloud API never does.
 */
const qr = catchAsync(async (req, res) => {
  const provider = providers.get();
  if (typeof provider.getQr !== "function") {
    return res.status(200).json({
      success: true,
      data: { available: false, reason: `provider "${provider.name}" does not use QR linking` },
    });
  }

  const pending = provider.getQr();
  if (!pending) {
    return res.status(200).json({
      success: true,
      data: {
        available: false,
        reason: provider.status().ready
          ? "already linked"
          : "no QR pending — the session may still be starting",
      },
    });
  }

  // A failed render must not hide the payload — the raw string is still
  // usable by any QR generator.
  let dataUrl = null;
  try {
    dataUrl = await QRCode.toDataURL(pending.qr, { margin: 1, width: 320 });
  } catch (err) {
    console.error("[whatsapp] QR render failed:", err?.message || err);
  }

  res.status(200).json({
    success: true,
    data: { available: true, qr: pending.qr, dataUrl, at: pending.at },
  });
});

/** Re-initialise the provider, e.g. after a session drop. */
const restart = catchAsync(async (req, res) => {
  const provider = providers.get();
  await provider.stop();
  const result = await providers.start();
  res.status(200).json({ success: true, data: { restarted: true, ...result } });
});

/**
 * Send a real message to one user, to confirm the pipe works end to end
 * before relying on it for reminders. Unkeyed, so it can be repeated.
 */
const testSend = catchAsync(async (req, res) => {
  const { userId, message } = req.body || {};
  if (!userId) throw new AppError("userId is required", 400);

  const user = await User.findById(userId).select("name phone whatsappNotifications").lean();
  if (!user) throw new AppError("User not found", 404);
  if (!user.phone) throw new AppError("That user has no phone number on file", 400);

  const parsed = phone.normalize(user.phone);
  if (!parsed.ok) {
    throw new AppError(`Their phone number can't be used: ${parsed.reason}`, 400);
  }

  const result = await whatsappService.sendMessage({
    to: user.phone,
    type: "admin_message",
    recipient: user._id,
    optedOut: user.whatsappNotifications === false,
    data: {
      name: user.name,
      title: "Exam Duty test message",
      message:
        message ||
        "This is a test from the Exam Duty system. If you received it, WhatsApp notifications are working.",
      senderName: null,
    },
  });

  res.status(200).json({
    success: true,
    data: { ...result, to: phone.mask(parsed.e164) },
  });
});

/** Recent send log, numbers masked. */
const logs = catchAsync(async (req, res) => {
  const rows = await whatsappRepository.findRecent({}, Number(req.query.limit) || 50);
  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows.map((r) => ({ ...r, to: phone.mask(r.to) })),
  });
});

/**
 * Roster readiness: how many users could actually be reached on WhatsApp.
 * Answers "is it worth switching this on yet?" before anyone relies on it.
 */
const coverage = catchAsync(async (req, res) => {
  const users = await User.find({})
    .select("name phone roles department whatsappNotifications")
    .lean();

  const unusable = [];
  let usable = 0;
  let optedOut = 0;

  for (const u of users) {
    const parsed = phone.normalize(u.phone);
    if (!parsed.ok) {
      unusable.push({
        id: String(u._id),
        name: u.name,
        department: u.department || null,
        reason: parsed.reason,
      });
    } else if (u.whatsappNotifications === false) {
      optedOut += 1;
    } else {
      usable += 1;
    }
  }

  res.status(200).json({
    success: true,
    data: { total: users.length, usable, optedOut, unusable: unusable.length, missing: unusable },
  });
});

module.exports = { health, qr, restart, testSend, logs, coverage };
