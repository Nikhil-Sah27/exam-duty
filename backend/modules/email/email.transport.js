const nodemailer = require("nodemailer");

/**
 * SMTP transport, created lazily on first send.
 *
 * The app must run fully without SMTP credentials — in-app notifications are
 * the primary channel and email is an add-on. When config is absent, every
 * send is recorded as `skipped_not_configured` in the EmailLog instead of
 * throwing, so the feature can be switched on later by adding env vars and
 * restarting. Nothing else changes.
 *
 * Required to enable:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * Optional:
 *   SMTP_SECURE   "true" to force TLS-on-connect (default: port === 465)
 *   MAIL_FROM     From header (default: "Exam Duty <SMTP_USER>")
 *   MAIL_REPLY_TO Reply-To header
 *   APP_URL       Base URL used for links inside emails
 *   EMAIL_ENABLED "false" kills all sending even when SMTP is configured
 */

const isEnabled = () => process.env.EMAIL_ENABLED !== "false";

const hasCredentials = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );

const isConfigured = () => isEnabled() && hasCredentials();

let transporter = null;

const getTransport = () => {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 is implicit TLS; 587/25 upgrade via STARTTLS.
    secure:
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const getFrom = () =>
  process.env.MAIL_FROM || `Exam Duty <${process.env.SMTP_USER}>`;

const getReplyTo = () => process.env.MAIL_REPLY_TO || undefined;

/** Handshake check for the health endpoint — never called on the send path. */
const verify = async () => {
  const t = getTransport();
  if (!t) {
    return {
      configured: false,
      ok: false,
      reason: isEnabled()
        ? "SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS not set"
        : "EMAIL_ENABLED=false",
    };
  }
  try {
    await t.verify();
    return { configured: true, ok: true, host: process.env.SMTP_HOST };
  } catch (err) {
    return { configured: true, ok: false, reason: err.message };
  }
};

/** Drop the cached transport so new env values take effect without a restart. */
const reset = () => {
  transporter = null;
};

module.exports = { getTransport, isConfigured, getFrom, getReplyTo, verify, reset };
