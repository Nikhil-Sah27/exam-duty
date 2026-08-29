/**
 * WhatsApp Cloud API adapter (official Meta).
 *
 * Stateless HTTPS — no browser, no session on disk, no QR. That is what makes
 * it the one that survives containers, autoscaling and redeploys, which is
 * why it is the production default.
 *
 * The 24-hour rule: Meta only allows free-form text to a user who has
 * messaged you in the last 24 hours. A duty reminder never satisfies that, so
 * sends go out as a pre-approved *template* by default. `WHATSAPP_ALLOW_TEXT=true`
 * switches to free-form, which is only useful for testing against a number
 * that has just messaged the business.
 *
 * Config:
 *   WHATSAPP_PHONE_NUMBER_ID   from Meta Business (the sender)
 *   WHATSAPP_ACCESS_TOKEN      permanent system-user token
 *   WHATSAPP_API_VERSION       graph version, default v21.0
 *   WHATSAPP_TEMPLATE_LANG     template locale, default en
 *   WHATSAPP_ALLOW_TEXT        "true" to send free-form instead of templates
 */

const DEFAULT_API_VERSION = "v21.0";
const REQUEST_TIMEOUT_MS = 20_000;

const isConfigured = () =>
  Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);

const missingReason = () => {
  const missing = [];
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) missing.push("WHATSAPP_PHONE_NUMBER_ID");
  if (!process.env.WHATSAPP_ACCESS_TOKEN) missing.push("WHATSAPP_ACCESS_TOKEN");
  return `${missing.join(" / ")} not set`;
};

const endpoint = () =>
  `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION}` +
  `/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const useTemplates = () => process.env.WHATSAPP_ALLOW_TEXT !== "true";

/** Build the Graph payload for one message. */
const buildPayload = (waId, rendered) => {
  if (!useTemplates()) {
    return {
      messaging_product: "whatsapp",
      to: waId,
      type: "text",
      text: { preview_url: false, body: rendered.body },
    };
  }

  const tpl = rendered.template;
  if (!tpl?.name) {
    throw new Error("template mode is on but this message declares no template name");
  }

  return {
    messaging_product: "whatsapp",
    to: waId,
    type: "template",
    template: {
      name: tpl.name,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
      components: tpl.variables?.length
        ? [
            {
              type: "body",
              parameters: tpl.variables.map((v) => ({ type: "text", text: String(v) })),
            },
          ]
        : [],
    },
  };
};

/**
 * @returns {Promise<{ok: true, messageId: string} | {ok: false, error: string}>}
 * Never throws — the caller logs the result either way.
 */
const send = async (waId, rendered) => {
  let payload;
  try {
    payload = buildPayload(waId, rendered);
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Meta nests the useful part; surface it rather than "400 Bad Request".
      const detail =
        json?.error?.error_user_msg ||
        json?.error?.message ||
        `HTTP ${res.status}`;
      return { ok: false, error: detail };
    }

    return { ok: true, messageId: json?.messages?.[0]?.id || null };
  } catch (err) {
    const reason =
      err.name === "AbortError"
        ? `request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : err.message;
    return { ok: false, error: reason };
  } finally {
    clearTimeout(timer);
  }
};

/** Cheap reachability probe for the health endpoint. */
const verify = async () => {
  if (!isConfigured()) {
    return { configured: false, ok: false, reason: missingReason() };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION}` +
        `/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name`,
      {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
        signal: controller.signal,
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        configured: true,
        ok: false,
        reason: json?.error?.message || `HTTP ${res.status}`,
      };
    }
    return {
      configured: true,
      ok: true,
      number: json?.display_phone_number || null,
      name: json?.verified_name || null,
      mode: useTemplates() ? "templates" : "free-form text",
    };
  } catch (err) {
    return { configured: true, ok: false, reason: err.message };
  } finally {
    clearTimeout(timer);
  }
};

// Nothing to boot — the adapter is stateless.
const start = async () => ({ ok: isConfigured() });
const stop = async () => {};
const status = () => ({
  provider: "cloud_api",
  configured: isConfigured(),
  ready: isConfigured(),
  mode: useTemplates() ? "templates" : "free-form text",
  needsQr: false,
});

module.exports = { name: "cloud_api", isConfigured, send, verify, start, stop, status };
