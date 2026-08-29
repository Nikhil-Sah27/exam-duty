/**
 * Phone number normalisation for WhatsApp.
 *
 * `User.phone` is free text — staff records carry "9845012345", "98450 12345",
 * "+91 98450-12345", "091-9845012345" and worse. WhatsApp addresses need one
 * canonical form, so everything is reduced to E.164 (`+<country><subscriber>`)
 * before it is used, and anything that can't be reduced confidently is
 * rejected rather than guessed at — a misrouted duty reminder goes to a real
 * stranger.
 *
 * DEFAULT_COUNTRY_CODE (default "+91") is applied only to numbers that carry
 * no country code of their own. A number already written with a leading "+"
 * is always taken at face value.
 */

const DEFAULT_CC = () => {
  const raw = String(process.env.DEFAULT_COUNTRY_CODE || "+91").trim();
  return raw.startsWith("+") ? raw : `+${raw}`;
};

// E.164 allows at most 15 digits including the country code; the shortest
// real international numbers are around 8.
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/**
 * @returns {{ ok: true, e164: string, digits: string }
 *          | { ok: false, reason: string }}
 */
const normalize = (raw, { defaultCountryCode } = {}) => {
  if (raw === null || raw === undefined) return { ok: false, reason: "empty" };

  const input = String(raw).trim();
  if (!input) return { ok: false, reason: "empty" };

  // Strip everything that isn't a digit or the leading plus.
  const hadPlus = input.startsWith("+") || input.startsWith("00");
  let digits = input.replace(/[^\d]/g, "");
  if (!digits) return { ok: false, reason: "no digits" };

  // "00" is the other way of writing a leading "+".
  if (input.startsWith("00")) digits = digits.slice(2);

  // A national trunk prefix ("0" before the subscriber number, as in
  // "09845012345" or "091-9845012345") has no place in E.164 and would
  // otherwise be mistaken for part of a country code by the length checks
  // below. Only strip it when the number wasn't written internationally.
  if (!hadPlus) digits = digits.replace(/^0+/, "");
  if (!digits) return { ok: false, reason: "no digits" };

  const cc = (defaultCountryCode || DEFAULT_CC()).replace(/[^\d]/g, "");

  let full;
  if (hadPlus) {
    full = digits;
  } else if (digits.startsWith(cc) && digits.length > cc.length + MIN_DIGITS - 2) {
    // Already carries the country code without a plus, e.g. "919845012345".
    full = digits;
  } else if (digits.length > 11) {
    // Too long to be a bare national number — assume the country code is
    // already in there rather than prefixing another one on top.
    full = digits;
  } else {
    // A leading trunk "0" (e.g. "09845012345") is dropped before prefixing.
    full = cc + digits;
  }

  if (full.length < MIN_DIGITS) return { ok: false, reason: "too short" };
  if (full.length > MAX_DIGITS) return { ok: false, reason: "too long" };

  return { ok: true, e164: `+${full}`, digits: full };
};

/** E.164 without the "+" — the form both providers address messages with. */
const toWhatsAppId = (raw, opts) => {
  const result = normalize(raw, opts);
  return result.ok ? result.digits : null;
};

/** Redacted form for logs and admin screens: "+9198450•••45". */
const mask = (e164) => {
  if (!e164) return "";
  const s = String(e164);
  if (s.length <= 6) return s;
  return `${s.slice(0, -5)}•••${s.slice(-2)}`;
};

module.exports = { normalize, toWhatsAppId, mask, DEFAULT_CC, MIN_DIGITS, MAX_DIGITS };
