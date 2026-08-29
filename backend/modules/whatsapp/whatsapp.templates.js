/**
 * WhatsApp message bodies.
 *
 * WhatsApp is not email. Messages are read on a phone, often mid-corridor,
 * so every template is short, front-loads the decision-relevant fact, and
 * uses WhatsApp's own markup (*bold*, _italic_) rather than HTML.
 *
 * Each template returns:
 *   {
 *     body,               // the plain text, used as-is by whatsapp-web.js
 *     template: {         // Cloud API only — see the note below
 *       name, variables   // approved template name + ordered {{1}}, {{2}}…
 *     }
 *   }
 *
 * The Cloud API cannot send free-form text to someone who has not messaged
 * you in the last 24 hours, which is exactly the situation for a duty
 * reminder. Those must go out as a *pre-approved template* with variable
 * substitution. So each template here declares both forms: the literal text
 * (what whatsapp-web.js sends, and what the approved template should say)
 * and the ordered variables the Cloud API substitutes into it.
 *
 * When registering these in Meta Business Manager, create a template whose
 * body matches the text below with {{1}}, {{2}}… in place of the variables,
 * and name it exactly as `template.name`.
 */

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
  rs: "Room Superintendent",
  invigilator: "Invigilator",
};

const LEAD_PHRASES = {
  "7d": "in one week",
  "1d": "tomorrow",
  "2h": "in about 2 hours",
};

/** "1 Sep, 9:30 AM–11:00 AM · Academic Block 004" */
const dutyLine = (d) => {
  const parts = [];
  const when = [formatDate(d.date), `${formatTime12h(d.startTime)}–${formatTime12h(d.endTime)}`]
    .filter(Boolean)
    .join(", ");
  if (when) parts.push(when);
  if (d.roomLabel || d.room) parts.push(d.roomLabel || d.room);
  return parts.join(" · ");
};

/**
 * Cloud API template variables must not contain newlines or runs of spaces —
 * Meta rejects the send outright. Multi-duty lists are therefore flattened
 * to a single separated string when used as a variable.
 */
const flatten = (value) => String(value ?? "").replace(/\s*\n\s*/g, " | ").replace(/\s{2,}/g, " ").trim();

const templates = {
  duty_reminder: ({ name, lead, duties = [] }) => {
    const phrase = LEAD_PHRASES[lead] || "soon";
    const count = duties.length;
    const list = duties.map((d) => `• ${dutyLine(d)}`).join("\n");

    const body =
      `*Exam duty ${phrase}*\n\n` +
      `Hello ${name || "there"}, you have ${count} ${count === 1 ? "duty" : "duties"} ${phrase}:\n\n` +
      `${list}\n\n` +
      `Please report to your allotted room ahead of the start time.`;

    return {
      body,
      template: {
        name: "exam_duty_reminder",
        variables: [name || "there", String(count), phrase, flatten(list)],
      },
    };
  },

  duty_assigned: ({ name, ...duty }) => {
    const body =
      `*New exam duty assigned*\n\n` +
      `Hello ${name || "there"}, you have been assigned:\n\n` +
      `• ${dutyLine(duty)}\n` +
      (duty.role ? `• Role: ${ROLE_LABELS[duty.role] || duty.role}\n` : "");

    return {
      body,
      template: {
        name: "exam_duty_assigned",
        variables: [name || "there", flatten(dutyLine(duty))],
      },
    };
  },

  duty_cancelled: ({ name, ...duty }) => {
    const body =
      `*Exam duty cancelled*\n\n` +
      `Hello ${name || "there"}, this duty has been cancelled:\n\n` +
      `• ${dutyLine(duty)}\n\n` +
      `No action is needed from you.`;

    return {
      body,
      template: {
        name: "exam_duty_cancelled",
        variables: [name || "there", flatten(dutyLine(duty))],
      },
    };
  },

  exam_deleted_duty_release: ({ name, ...duty }) => {
    const body =
      `*Exam duty released*\n\n` +
      `Hello ${name || "there"}, the exam below was deleted by the Controller, so your duty is released:\n\n` +
      `• ${dutyLine(duty)}\n\n` +
      `You are free during this slot and may claim another duty.`;

    return {
      body,
      template: {
        name: "exam_duty_released",
        variables: [name || "there", flatten(dutyLine(duty))],
      },
    };
  },

  duty_swapped: ({ name, ...duty }) => {
    const body =
      `*Duty swapped to you*\n\n` +
      `Hello ${name || "there"}, a duty is now on your schedule:\n\n` +
      `• ${dutyLine(duty)}`;

    return {
      body,
      template: {
        name: "exam_duty_swapped",
        variables: [name || "there", flatten(dutyLine(duty))],
      },
    };
  },

  request_submitted: ({ name, type, requesterName }) => {
    const body =
      `*Change request awaiting review*\n\n` +
      `Hello ${name || "there"}, a ${type || "change"} request` +
      `${requesterName ? ` from ${requesterName}` : ""} needs your review.`;

    return {
      body,
      template: {
        name: "change_request_submitted",
        variables: [name || "there", type || "change", requesterName || "a colleague"],
      },
    };
  },

  request_approved: ({ name, type, reviewNote }) => {
    const body =
      `*Request approved*\n\n` +
      `Hello ${name || "there"}, your ${type || "change"} request has been approved. ` +
      `Your duty list is updated.` +
      (reviewNote ? `\n\n_${reviewNote}_` : "");

    return {
      body,
      template: {
        name: "change_request_approved",
        variables: [name || "there", type || "change"],
      },
    };
  },

  request_rejected: ({ name, type, reviewNote }) => {
    const body =
      `*Request rejected*\n\n` +
      `Hello ${name || "there"}, your ${type || "change"} request has been rejected. ` +
      `Your existing duty stands.` +
      (reviewNote ? `\n\n_${reviewNote}_` : "");

    return {
      body,
      template: {
        name: "change_request_rejected",
        variables: [name || "there", type || "change"],
      },
    };
  },

  admin_message: ({ name, title, message, senderName }) => {
    const body =
      `*${title || "Message from the Exam Duty office"}*\n\n` +
      `Hello ${name || "there"},\n\n` +
      `${message || ""}` +
      (senderName ? `\n\n— ${senderName}` : "");

    return {
      body,
      template: {
        name: "exam_duty_announcement",
        variables: [name || "there", flatten(title || ""), flatten(message || "")],
      },
    };
  },
};

module.exports = { templates, dutyLine, formatDate, formatTime12h, LEAD_PHRASES };
