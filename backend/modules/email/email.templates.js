/**
 * Email templates — subject + HTML + plain-text for every outbound email.
 *
 * Mirrors the role of notification.templates.js: wording lives here and
 * nowhere else. Each template returns { subject, html, text }.
 *
 * Constraints kept deliberately tight because email clients are hostile:
 *   • table-based layout, inline styles only (no <style> blocks, no flex/grid)
 *   • no external images or webfonts
 *   • every HTML email ships a plain-text twin for deliverability
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const formatLongDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

const formatSlot = (startTime, endTime) =>
  `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;

const ROLE_LABELS = {
  cs: "Controller of Superintendents",
  dcs: "Deputy Controller of Superintendents",
  rs: "Room Superintendent",
  invigilator: "Invigilator",
};

// Escape before interpolating anything user-supplied (admin message bodies,
// review notes, teacher names) into HTML.
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const appUrl = () => (process.env.APP_URL || "").replace(/\/$/, "");

const BRAND = "Exam Duty";
const INK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#2563eb";

/** Shared chrome. `bodyHtml` is trusted markup built by a template below. */
const layout = ({ heading, bodyHtml, ctaLabel, ctaPath, footerNote }) => {
  const base = appUrl();
  const cta =
    ctaLabel && base
      ? `<tr><td style="padding:24px 32px 0 32px;">
           <a href="${base}${ctaPath || "/"}"
              style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;
                     font-size:14px;font-weight:600;padding:11px 20px;border-radius:6px;">
             ${esc(ctaLabel)}
           </a>
         </td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="padding:20px 32px;border-bottom:1px solid ${BORDER};">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${ACCENT};">${BRAND}</span>
        </td></tr>
        <tr><td style="padding:28px 32px 0 32px;">
          <h1 style="margin:0;font-size:19px;line-height:1.35;font-weight:600;color:${INK};">${esc(heading)}</h1>
        </td></tr>
        <tr><td style="padding:14px 32px 0 32px;font-size:14px;line-height:1.6;color:#374151;">
          ${bodyHtml}
        </td></tr>
        ${cta}
        <tr><td style="padding:28px 32px 24px 32px;border-top:1px solid ${BORDER};margin-top:24px;">
          <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:${MUTED};">
            ${esc(footerNote || "This is an automated message from the Exam Duty system. Please do not reply.")}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

/** Key/value block used by every duty-shaped email. */
const detailTable = (rows) => {
  const cells = rows
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
          <td style="padding:6px 0;font-size:14px;color:${INK};font-weight:500;">${esc(value)}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0"
                 style="margin:16px 0 0 0;width:100%;background:#f9fafb;border:1px solid ${BORDER};
                        border-radius:8px;padding:12px 16px;">${cells}</table>`;
};

const detailText = (rows) =>
  rows
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([label, value]) => `  ${label}: ${value}`)
    .join("\n");

const dutyRows = ({ examLabel, semester, roomLabel, date, startTime, endTime, role }) => [
  ["Exam", semester != null && examLabel ? `${examLabel} — Semester ${semester}` : examLabel],
  ["Date", date ? formatLongDate(date) : null],
  ["Time", startTime && endTime ? formatSlot(startTime, endTime) : null],
  ["Room", roomLabel],
  ["Role", role ? ROLE_LABELS[role] || role : null],
];

/** Human phrasing for a reminder lead time. */
const LEAD_PHRASES = {
  "7d": "in one week",
  "1d": "tomorrow",
  "2h": "in about 2 hours",
};

const templates = {
  /**
   * Scheduled reminder. Digest-shaped: one email covers every duty a teacher
   * has in the target window, so a person with four rooms tomorrow gets one
   * message rather than four.
   */
  duty_reminder: ({ name, lead, duties = [] }) => {
    const phrase = LEAD_PHRASES[lead] || "soon";
    const count = duties.length;
    const plural = count === 1 ? "duty" : "duties";

    const subject =
      lead === "2h"
        ? `Reminder: your exam duty starts in about 2 hours`
        : `Reminder: ${count} exam ${plural} ${phrase}`;

    const blocks = duties
      .map((d) => detailTable(dutyRows(d)))
      .join("");

    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">
        You have <strong>${count} ${plural}</strong> scheduled ${esc(phrase)}.
        Please report to your allotted room ahead of the start time.
      </p>
      ${blocks}`;

    const text = [
      `Hello ${name || "there"},`,
      "",
      `You have ${count} ${plural} scheduled ${phrase}. Please report to your allotted room ahead of the start time.`,
      "",
      ...duties.map((d) => `${detailText(dutyRows(d))}\n`),
    ].join("\n");

    return {
      subject,
      html: layout({
        heading: count === 1 ? `Your exam duty is ${phrase}` : `Your exam duties are ${phrase}`,
        bodyHtml,
        ctaLabel: "View my duties",
        ctaPath: "/",
      }),
      text,
    };
  },

  duty_assigned: ({ name, ...duty }) => {
    const rows = dutyRows(duty);
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">You have been assigned the following exam duty.</p>
      ${detailTable(rows)}`;

    return {
      subject: `New exam duty assigned${duty.date ? ` — ${formatLongDate(duty.date)}` : ""}`,
      html: layout({ heading: "New duty assigned", bodyHtml, ctaLabel: "View my duties", ctaPath: "/" }),
      text: `Hello ${name || "there"},\n\nYou have been assigned the following exam duty.\n\n${detailText(rows)}\n`,
    };
  },

  duty_cancelled: ({ name, reason, ...duty }) => {
    const rows = dutyRows(duty);
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">The following exam duty has been cancelled. No action is needed from you.</p>
      ${detailTable(rows)}
      ${reason ? `<p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};">Reason: ${esc(reason)}</p>` : ""}`;

    return {
      subject: `Exam duty cancelled${duty.date ? ` — ${formatLongDate(duty.date)}` : ""}`,
      html: layout({ heading: "Duty cancelled", bodyHtml, ctaLabel: "View my duties", ctaPath: "/" }),
      text: `Hello ${name || "there"},\n\nThe following exam duty has been cancelled.\n\n${detailText(rows)}\n${reason ? `\nReason: ${reason}\n` : ""}`,
    };
  },

  exam_deleted_duty_release: ({ name, ...duty }) => {
    const rows = dutyRows(duty);
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">
        The exam below has been deleted by the Controller, so your duty for it has been released.
      </p>
      ${detailTable(rows)}
      <p style="margin:16px 0 0 0;">You are free during this slot and may claim another duty.</p>`;

    return {
      subject: "Exam duty released — exam deleted",
      html: layout({ heading: "Duty released", bodyHtml, ctaLabel: "Select a new duty", ctaPath: "/" }),
      text: `Hello ${name || "there"},\n\nThe exam below has been deleted by the Controller, so your duty for it has been released.\n\n${detailText(rows)}\n\nYou are free during this slot and may claim another duty.\n`,
    };
  },

  duty_swapped: ({ name, ...duty }) => {
    const rows = dutyRows(duty);
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">A duty has been swapped to you and is now on your schedule.</p>
      ${detailTable(rows)}`;

    return {
      subject: "A duty has been swapped to you",
      html: layout({ heading: "New duty from a swap", bodyHtml, ctaLabel: "View my duties", ctaPath: "/" }),
      text: `Hello ${name || "there"},\n\nA duty has been swapped to you and is now on your schedule.\n\n${detailText(rows)}\n`,
    };
  },

  request_submitted: ({ name, type, requesterName, date }) => {
    const rows = [
      ["Request type", type],
      ["Raised by", requesterName],
      ["Duty date", date ? formatLongDate(date) : null],
    ];
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">A change request is awaiting your review.</p>
      ${detailTable(rows)}`;

    return {
      subject: `Change request awaiting review${type ? ` — ${type}` : ""}`,
      html: layout({ heading: "Change request submitted", bodyHtml, ctaLabel: "Review requests", ctaPath: "/requests" }),
      text: `Hello ${name || "there"},\n\nA change request is awaiting your review.\n\n${detailText(rows)}\n`,
    };
  },

  request_approved: ({ name, type, reviewNote }) => {
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">
        Your <strong>${esc(type || "change")}</strong> request has been <strong>approved</strong>.
        Your duty list has been updated.
      </p>
      ${reviewNote ? `<p style="margin:16px 0 0 0;padding:12px 14px;background:#f9fafb;border-left:3px solid ${ACCENT};font-size:13px;color:#374151;">${esc(reviewNote)}</p>` : ""}`;

    return {
      subject: `Your ${type || "change"} request was approved`,
      html: layout({ heading: "Request approved", bodyHtml, ctaLabel: "View my duties", ctaPath: "/" }),
      text: `Hello ${name || "there"},\n\nYour ${type || "change"} request has been approved. Your duty list has been updated.\n${reviewNote ? `\nNote: ${reviewNote}\n` : ""}`,
    };
  },

  request_rejected: ({ name, type, reviewNote }) => {
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <p style="margin:12px 0 0 0;">
        Your <strong>${esc(type || "change")}</strong> request has been <strong>rejected</strong>.
        Your existing duty stands unchanged.
      </p>
      ${reviewNote ? `<p style="margin:16px 0 0 0;padding:12px 14px;background:#f9fafb;border-left:3px solid #d1d5db;font-size:13px;color:#374151;">${esc(reviewNote)}</p>` : ""}`;

    return {
      subject: `Your ${type || "change"} request was rejected`,
      html: layout({ heading: "Request rejected", bodyHtml, ctaLabel: "View my duties", ctaPath: "/" }),
      text: `Hello ${name || "there"},\n\nYour ${type || "change"} request has been rejected. Your existing duty stands unchanged.\n${reviewNote ? `\nNote: ${reviewNote}\n` : ""}`,
    };
  },

  /** Free-text message composed by CS. Body is user input — escape and keep line breaks. */
  admin_message: ({ name, title, message, senderName }) => {
    const bodyHtml = `
      <p style="margin:0;">Hello ${esc(name || "there")},</p>
      <div style="margin:12px 0 0 0;white-space:pre-wrap;">${esc(message)}</div>
      ${senderName ? `<p style="margin:20px 0 0 0;font-size:13px;color:${MUTED};">— ${esc(senderName)}, Controller of Superintendents</p>` : ""}`;

    return {
      subject: title || "A message from the Exam Duty office",
      html: layout({
        heading: title || "A message from the Exam Duty office",
        bodyHtml,
        ctaLabel: "Open Exam Duty",
        ctaPath: "/",
        footerNote: "You received this because you are registered in the Exam Duty system.",
      }),
      text: `Hello ${name || "there"},\n\n${message}\n${senderName ? `\n— ${senderName}, Controller of Superintendents\n` : ""}`,
    };
  },
};

module.exports = { templates, formatLongDate, formatTime12h, formatSlot, ROLE_LABELS };
