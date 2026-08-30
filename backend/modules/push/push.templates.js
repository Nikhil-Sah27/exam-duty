/**
 * Push notification titles and bodies.
 *
 * Push is the tightest of the four channels by a wide margin. A locked phone
 * shows roughly one line of title and two of body before the OS truncates —
 * there is no "read more". So every template here states the one fact that
 * decides whether the reader picks the phone up, and nothing else. The email
 * copy of the same notification carries the detail; this is the tap target.
 *
 * Each template returns:
 *   {
 *     title,   // ≤ TITLE_MAX chars, one line
 *     body,    // ≤ BODY_MAX chars, two lines
 *     data     // deep-link payload, delivered to the app untouched
 *   }
 *
 * `data.screen` is a *logical* destination, not a route. The mobile app maps
 * it onto whichever path the signed-in role uses, because the three
 * operational roles share one page set under different base paths — a server
 * that hard-coded "/rs/upcoming-duties" would deep-link an invigilator into a
 * screen they cannot open. No entity ids are included: today's notification
 * payloads carry none, so a push lands on the list screen rather than a
 * specific record.
 *
 * The whole Expo payload (data included) must stay under 4KiB or the send is
 * rejected with MessageTooBig, which is the other reason everything is clamped.
 */

const TITLE_MAX = 48;
const BODY_MAX = 140;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const formatTime12h = (hhmm) => {
  if (!hhmm || typeof hhmm !== "string") return "";
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
};

const ROLE_LABELS = {
  dcs: "DCS",
  rs: "RS",
  invigilator: "Invigilator",
};

const LEAD_PHRASES = {
  "7d": "in a week",
  "1d": "tomorrow",
  "2h": "in ~2 hours",
};

/**
 * Collapse to a single line and cut to length. Newlines are stripped rather
 * than kept: a lock-screen notification renders them as spaces anyway, and
 * they waste the character budget.
 */
const clamp = (value, max) => {
  const flat = String(value ?? "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

/** "1 Sep, 9:30 AM–11:00 AM · Academic Block 004" */
const dutyLine = (d) => {
  const parts = [];
  const when = [formatDate(d.date), `${formatTime12h(d.startTime)}–${formatTime12h(d.endTime)}`]
    .filter((s) => s && s !== "–")
    .join(", ");
  if (when) parts.push(when);
  if (d.roomLabel || d.room) parts.push(d.roomLabel || d.room);
  return parts.join(" · ");
};

// Logical destinations. Duty-shaped notifications land on the duty list;
// request-shaped ones on the change-request list; anything else on the bell.
const SCREENS = {
  DUTIES: "upcoming-duties",
  REQUESTS: "change-requests",
  NOTIFICATIONS: "notifications",
};

const link = (type, screen) => ({ type, screen });

const templates = {
  duty_reminder: ({ lead, duties = [] }) => {
    const phrase = LEAD_PHRASES[lead] || "soon";
    const count = duties.length;
    const first = count ? dutyLine(duties[0]) : "";
    const more = count > 1 ? ` +${count - 1} more` : "";

    return {
      title: clamp(count === 1 ? `Exam duty ${phrase}` : `${count} exam duties ${phrase}`, TITLE_MAX),
      body: clamp(first ? `${first}${more}` : "Open the app for the details.", BODY_MAX),
      data: link("duty_reminder", SCREENS.DUTIES),
    };
  },

  duty_assigned: (duty) => {
    const line = [
      duty.role ? ROLE_LABELS[duty.role] || duty.role : null,
      dutyLine(duty),
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      title: clamp("New exam duty assigned", TITLE_MAX),
      body: clamp(line || "Open the app for the details.", BODY_MAX),
      data: link("duty_assigned", SCREENS.DUTIES),
    };
  },

  duty_cancelled: (duty) => ({
    title: clamp("Exam duty cancelled", TITLE_MAX),
    body: clamp(`${dutyLine(duty)} — no action needed.`, BODY_MAX),
    data: link("duty_cancelled", SCREENS.DUTIES),
  }),

  exam_deleted_duty_release: (duty) => ({
    title: clamp("Exam deleted — duty released", TITLE_MAX),
    body: clamp(`${dutyLine(duty)}. You are free this slot.`, BODY_MAX),
    data: link("exam_deleted_duty_release", SCREENS.DUTIES),
  }),

  duty_swapped: (duty) => ({
    title: clamp("Duty swapped to you", TITLE_MAX),
    body: clamp(dutyLine(duty) || "A duty is now on your schedule.", BODY_MAX),
    data: link("duty_swapped", SCREENS.DUTIES),
  }),

  request_submitted: ({ type, requesterName }) => ({
    title: clamp("Change request to review", TITLE_MAX),
    body: clamp(
      `A ${type || "change"} request${requesterName ? ` from ${requesterName}` : ""} needs your review.`,
      BODY_MAX,
    ),
    data: link("request_submitted", SCREENS.REQUESTS),
  }),

  request_approved: ({ type, reviewNote }) => ({
    title: clamp("Request approved", TITLE_MAX),
    body: clamp(
      reviewNote
        ? `Your ${type || "change"} request was approved: ${reviewNote}`
        : `Your ${type || "change"} request was approved. Your duty list is updated.`,
      BODY_MAX,
    ),
    data: link("request_approved", SCREENS.REQUESTS),
  }),

  request_rejected: ({ type, reviewNote }) => ({
    title: clamp("Request rejected", TITLE_MAX),
    body: clamp(
      reviewNote
        ? `Your ${type || "change"} request was rejected: ${reviewNote}`
        : `Your ${type || "change"} request was rejected. Your existing duty stands.`,
      BODY_MAX,
    ),
    data: link("request_rejected", SCREENS.REQUESTS),
  }),

  // Free text from CS. The compose form is the only validation point, so both
  // fields are clamped hard before they reach a lock screen.
  admin_message: ({ title, message }) => ({
    title: clamp(title || "Exam Duty office", TITLE_MAX),
    body: clamp(message || "", BODY_MAX),
    data: link("admin_message", SCREENS.NOTIFICATIONS),
  }),
};

module.exports = { templates, dutyLine, clamp, SCREENS, TITLE_MAX, BODY_MAX, LEAD_PHRASES };
