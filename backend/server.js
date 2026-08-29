const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./shared/config/db");
const reminderScheduler = require("./modules/reminder/reminder.scheduler");
const emailTransport = require("./modules/email/email.transport");
const whatsappProviders = require("./modules/whatsapp/providers");

// 5001, not 5000: macOS gives :5000 to ControlCenter (AirPlay Receiver), and the
// Vite proxy defaults to the same port — a fresh clone with no PORT set must
// still have the two agree.
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);

    // Email is optional. Without SMTP config the app runs exactly as before —
    // in-app notifications still fire, and every would-be email is recorded in
    // the EmailLog as skipped. Say so at boot rather than failing silently.
    if (!emailTransport.isConfigured()) {
      console.log(
        "[email] SMTP not configured — emails will be logged and skipped. " +
          "Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS to enable.",
      );
    }

    // WhatsApp is optional in the same way email is. The Cloud API adapter
    // needs no boot at all; the whatsapp-web.js one launches Chromium and may
    // sit waiting for a QR scan, so it is kicked off without being awaited.
    if (whatsappProviders.isConfigured()) {
      whatsappProviders.start().then((result) => {
        if (!result?.ok) {
          console.log(`[whatsapp] not started: ${result?.reason || "unknown reason"}`);
        }
      });
    } else {
      console.log(
        "[whatsapp] no provider configured — messages will be logged and skipped. " +
          "Set WHATSAPP_PROVIDER (cloud_api | webjs) to enable.",
      );
    }

    // Started after the DB is up: the job's first tick queries duties.
    reminderScheduler.start();
  });
});
