const cloudApi = require("./cloudApi.provider");
const webjs = require("./webjs.provider");

/**
 * Provider selection.
 *
 * WHATSAPP_PROVIDER picks the adapter:
 *   "cloud_api"  official Meta Cloud API (default when unset)
 *   "webjs"      whatsapp-web.js session
 *   "none"       disabled — every send is recorded and skipped
 *
 * The rest of the module only ever talks to the interface below, so moving a
 * pilot from webjs to the Cloud API is an env change and a restart, with no
 * code touched.
 */

const NULL_PROVIDER = {
  name: "none",
  isConfigured: () => false,
  send: async () => ({ ok: false, error: "no WhatsApp provider configured" }),
  verify: async () => ({
    configured: false,
    ok: false,
    reason:
      "WHATSAPP_PROVIDER is 'none' or unset with no Cloud API credentials — WhatsApp is off",
  }),
  start: async () => ({ ok: false, reason: "disabled" }),
  stop: async () => {},
  status: () => ({ provider: "none", configured: false, ready: false, needsQr: false }),
};

const selected = () => {
  const choice = (process.env.WHATSAPP_PROVIDER || "").trim().toLowerCase();
  if (choice === "webjs") return webjs;
  if (choice === "none") return NULL_PROVIDER;
  if (choice === "cloud_api") return cloudApi;

  // Unset: fall back to the Cloud API when its credentials happen to be
  // present, so setting the two env vars is enough to switch WhatsApp on.
  return cloudApi.isConfigured() ? cloudApi : NULL_PROVIDER;
};

const get = () => selected();

const isConfigured = () => get().isConfigured();

/** Boot whichever provider needs booting. Only webjs actually does. */
const start = async () => {
  const provider = get();
  if (provider.name === "none") return { ok: false, reason: "disabled" };
  return provider.start();
};

const stop = async () => get().stop();

module.exports = { get, isConfigured, start, stop, NULL_PROVIDER };
