/**
 * whatsapp-web.js adapter — drives a real WhatsApp Web session in headless
 * Chromium.
 *
 * Chosen trade-offs, because they shape how this can be deployed:
 *
 *   • Stateful. Authentication lives on disk (`WHATSAPP_SESSION_PATH`). The
 *     process must own a persistent volume; an ephemeral container re-asks
 *     for the QR on every deploy.
 *   • Single-instance. Two processes on one session will fight and get the
 *     number logged out. Do not run it behind an autoscaling group.
 *   • Heavy. Chromium costs ~500MB-1GB of RAM on top of Node.
 *   • Unofficial. It automates the consumer WhatsApp Web client, which the
 *     WhatsApp Terms of Service prohibit; the number can be banned.
 *
 * It is the right choice for a pilot on a single EC2 box with an attached
 * EBS volume, and the wrong one for anything that scales horizontally — that
 * is what the Cloud API adapter is for.
 *
 * The library is an OPTIONAL dependency. It is not installed by default
 * because of the Chromium download; when absent this adapter reports itself
 * unconfigured instead of crashing the app at boot. To enable:
 *
 *   cd backend && npm install whatsapp-web.js qrcode-terminal
 *
 * Config:
 *   WHATSAPP_SESSION_PATH   auth dir (default ./.wwebjs_auth) — must persist
 *   WHATSAPP_HEADLESS       "false" to watch the browser locally
 *   PUPPETEER_EXECUTABLE_PATH  system Chromium, if not using the bundled one
 */

const path = require("path");

const DEFAULT_SESSION_PATH = path.join(process.cwd(), ".wwebjs_auth");

// Resolved lazily so a missing optional dependency is a disabled feature,
// not a boot failure.
let lib = null;
let libLoadError = null;

const loadLib = () => {
  if (lib || libLoadError) return lib;
  try {
    // eslint-disable-next-line global-require
    lib = require("whatsapp-web.js");
  } catch (err) {
    libLoadError = err.message;
    lib = null;
  }
  return lib;
};

const isEnabled = () => process.env.WHATSAPP_PROVIDER === "webjs";
const isConfigured = () => isEnabled() && Boolean(loadLib());

/** Live session state. Everything here is process-local by nature. */
const state = {
  client: null,
  ready: false,
  starting: false,
  /** Latest QR payload, kept so an admin screen can render it. */
  qr: null,
  qrAt: null,
  lastError: null,
  me: null,
};

const puppeteerOptions = () => ({
  headless: process.env.WHATSAPP_HEADLESS !== "false",
  // --no-sandbox is required in most container/EC2 setups where the process
  // isn't running as a user with the necessary kernel namespaces.
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
  ],
  ...(process.env.PUPPETEER_EXECUTABLE_PATH
    ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
    : {}),
});

/**
 * Boot the client and wire its lifecycle events.
 * Resolves once initialisation has been kicked off — not once linked, since
 * first-time linking waits on a human scanning the QR.
 */
const start = async () => {
  if (!isEnabled()) return { ok: false, reason: "provider not selected" };

  const wweb = loadLib();
  if (!wweb) {
    return {
      ok: false,
      reason: `whatsapp-web.js is not installed (${libLoadError}). Run: npm install whatsapp-web.js qrcode-terminal`,
    };
  }
  if (state.client || state.starting) return { ok: true, reason: "already started" };

  state.starting = true;
  const { Client, LocalAuth } = wweb;

  try {
    state.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: process.env.WHATSAPP_SESSION_PATH || DEFAULT_SESSION_PATH,
      }),
      puppeteer: puppeteerOptions(),
    });

    state.client.on("qr", (qr) => {
      state.qr = qr;
      state.qrAt = new Date();
      state.ready = false;
      console.log(
        "[whatsapp] scan required — open WhatsApp › Linked devices › Link a device.",
      );
      // Optional pretty-printer; absent is fine, the raw string is still served
      // by GET /api/whatsapp/qr.
      try {
        // eslint-disable-next-line global-require
        require("qrcode-terminal").generate(qr, { small: true });
      } catch {
        console.log("[whatsapp] QR (install qrcode-terminal to render inline):", qr);
      }
    });

    state.client.on("ready", () => {
      state.ready = true;
      state.qr = null;
      state.lastError = null;
      state.me = state.client?.info?.wid?.user || null;
      console.log(`[whatsapp] linked and ready${state.me ? ` as ${state.me}` : ""}`);
    });

    state.client.on("auth_failure", (msg) => {
      state.ready = false;
      state.lastError = `auth failure: ${msg}`;
      console.error("[whatsapp] auth failure:", msg);
    });

    state.client.on("disconnected", (reason) => {
      state.ready = false;
      state.lastError = `disconnected: ${reason}`;
      console.error("[whatsapp] disconnected:", reason);
    });

    // initialize() resolves only once linked, so it is intentionally not
    // awaited — the server must finish booting either way.
    state.client.initialize().catch((err) => {
      state.lastError = err.message;
      state.starting = false;
      console.error("[whatsapp] initialize failed:", err.message);
    });

    return { ok: true };
  } catch (err) {
    state.starting = false;
    state.lastError = err.message;
    return { ok: false, reason: err.message };
  }
};

const stop = async () => {
  if (!state.client) return;
  try {
    await state.client.destroy();
  } catch {
    // Shutting down anyway.
  }
  state.client = null;
  state.ready = false;
  state.qr = null;
};

/**
 * @returns {Promise<{ok: true, messageId: string} | {ok: false, error: string}>}
 */
const send = async (waId, rendered) => {
  if (!state.client) return { ok: false, error: "client not started" };
  if (!state.ready) {
    return {
      ok: false,
      error: state.qr
        ? "not linked — a QR scan is pending"
        : state.lastError || "client not ready yet",
    };
  }

  try {
    const chatId = `${waId}@c.us`;

    // Ask WhatsApp whether the number actually has an account before sending;
    // messaging a non-WhatsApp number otherwise fails opaquely.
    if (typeof state.client.isRegisteredUser === "function") {
      const registered = await state.client.isRegisteredUser(chatId);
      if (!registered) return { ok: false, error: "number is not on WhatsApp" };
    }

    const msg = await state.client.sendMessage(chatId, rendered.body);
    return { ok: true, messageId: msg?.id?._serialized || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

const verify = async () => {
  if (!isEnabled()) {
    return { configured: false, ok: false, reason: "WHATSAPP_PROVIDER is not 'webjs'" };
  }
  if (!loadLib()) {
    return {
      configured: false,
      ok: false,
      reason: `whatsapp-web.js not installed (${libLoadError})`,
    };
  }
  if (state.ready) {
    return { configured: true, ok: true, number: state.me, mode: "linked session" };
  }
  return {
    configured: true,
    ok: false,
    reason: state.qr
      ? "waiting for QR scan"
      : state.lastError || "client not ready yet",
  };
};

const status = () => ({
  provider: "webjs",
  configured: isConfigured(),
  ready: state.ready,
  needsQr: Boolean(state.qr),
  qrAt: state.qrAt,
  number: state.me,
  lastError: state.lastError,
  sessionPath: process.env.WHATSAPP_SESSION_PATH || DEFAULT_SESSION_PATH,
});

/** Raw QR payload for the admin screen to render as an image. */
const getQr = () => (state.qr ? { qr: state.qr, at: state.qrAt } : null);

module.exports = { name: "webjs", isConfigured, send, verify, start, stop, status, getQr };
