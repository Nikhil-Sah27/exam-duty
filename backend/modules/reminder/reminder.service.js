const Duty = require("../duty/duty.model");
const User = require("../auth/auth.model");
// Required for their side effect: `collectDigests` populates through these
// refs, and Mongoose only resolves a ref whose model has been registered.
// The running server registers everything via app.js, but this service is
// also driven from standalone scripts and the cron — which load neither.
require("../exam/examSchedule.model");
require("../exam/examGroup.model");
require("../exam/examRoom.model");
require("../infrastructure/infrastructure.model"); // Room
require("../infrastructure/building.model");
const notificationRepository = require("../notification/notification.repository");
const notificationTemplates = require("../notification/notification.templates");
const emailRepository = require("../email/email.repository");
const emailService = require("../email/email.service");
const whatsappRepository = require("../whatsapp/whatsapp.repository");
const whatsappService = require("../whatsapp/whatsapp.service");
const phone = require("../whatsapp/phone.utils");
const windows = require("./reminder.windows");

/**
 * Duty reminders — "your duty is coming up", by in-app notification and email.
 *
 * Shape of a run, per lead window (7d / 1d / 2h):
 *   1. Pull `assigned` duties whose calendar date could fall in the window.
 *   2. Keep the ones whose real start instant lands inside it.
 *   3. Group them into (teacher, bucket) digests — see reminder.windows.
 *   4. Claim each digest's dedupe key. A duplicate means an earlier tick
 *      already sent it, so skip.
 *   5. On a fresh claim, write the in-app notification and send the email.
 *
 * The claim in step 4 gates both channels, so re-running this job — every
 * 15 minutes by cron, or by hand from the admin endpoint — never produces a
 * second copy of anything. That makes the whole job safe to retry, which is
 * what lets the cron tick often enough to hit the 2h window accurately.
 *
 * Cancelled duties are excluded by the `status: "assigned"` filter, so a duty
 * dropped after a 7d reminder simply stops appearing in later windows.
 */

const POPULATE = [
  {
    path: "teacher",
    select: "name email phone emailNotifications whatsappNotifications",
  },
  {
    path: "examSchedule",
    select: "date startTime endTime examGroup",
    populate: { path: "examGroup", select: "examType semester" },
  },
  {
    path: "examRoom",
    select: "room",
    populate: {
      path: "room",
      select: "roomNumber building",
      populate: { path: "building", select: "name" },
    },
  },
];

/** Human room label: "Academic Block 004", falling back to the stored string. */
const roomLabelOf = (duty) => {
  const room = duty.examRoom?.room;
  if (!room) return duty.room || null;
  const building = room.building?.name;
  return building ? `${building} ${room.roomNumber}` : String(room.roomNumber);
};

/** Flatten a duty into the payload both template families understand. */
const toDutyPayload = (duty) => {
  const group = duty.examSchedule?.examGroup;
  return {
    dutyId: String(duty._id),
    examLabel: group?.examType || null,
    semester: group?.semester ?? null,
    roomLabel: roomLabelOf(duty),
    date: duty.date,
    startTime: duty.startTime,
    endTime: duty.endTime,
    role: duty.role,
  };
};

/**
 * Collect the (teacher, bucket) digests due for one window right now.
 * Pure read — no writes, no sends. `runWindow` and `preview` share it.
 */
const collectDigests = async (window, now, tickMs) => {
  // null means this window isn't firing right now (a daily window before its
  // send hour) — nothing to collect.
  const range = windows.dateRangeFor(window, now, tickMs);
  if (!range) return [];

  const duties = await Duty.find({
    status: "assigned",
    date: { $gte: range.start, $lte: range.end },
  }).populate(POPULATE);

  const digests = new Map();

  for (const duty of duties) {
    if (!duty.teacher?._id) continue;

    const startAt = windows.dutyStartAt(duty.date, duty.startTime);
    // Precise check — the DB filter above is only day-grained.
    if (!startAt || !windows.matches(window, startAt, now, tickMs)) continue;

    const teacherId = String(duty.teacher._id);
    const bucket = windows.bucketFor(window, startAt);
    const key = `${teacherId}::${bucket}`;

    const existing = digests.get(key);
    if (existing) {
      existing.duties.push(toDutyPayload(duty));
    } else {
      digests.set(key, {
        teacher: duty.teacher,
        bucket,
        lead: window.lead,
        earliestStart: startAt,
        duties: [toDutyPayload(duty)],
      });
    }
  }

  // Chronological inside each digest so the email reads like a schedule.
  for (const digest of digests.values()) {
    digest.duties.sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date) ||
        String(a.startTime).localeCompare(String(b.startTime)),
    );
  }

  return [...digests.values()];
};

/**
 * Deliver one digest across every channel.
 *
 * Each channel claims its own dedupe key and is delivered independently. An
 * earlier version had the email log's claim gate all of them, which coupled
 * things that fail separately: a teacher with no email address would have
 * consumed the shared claim and silently lost the in-app notification too.
 * Three claims, three outcomes, one shared key suffix.
 *
 * The per-channel statuses are folded into one summary object so the caller
 * can report the run without knowing how many channels exist.
 */
const deliverDigest = async (digest) => {
  const teacherId = String(digest.teacher._id);
  const key = windows.dedupeKeyFor(digest.lead, teacherId, digest.bucket);
  const data = { name: digest.teacher.name, lead: digest.lead, duties: digest.duties };
  const outcome = {};

  // --- in-app -------------------------------------------------------------
  // Claimed like the rest so a re-run can't produce a second bell entry.
  try {
    const { title, message } = notificationTemplates.duty_reminder(data);
    const created = await notificationRepository.claim({
      recipient: digest.teacher._id,
      type: "duty_reminder",
      title,
      message,
      refModel: "Duty",
      refId: digest.duties[0]?.dutyId || null,
      dedupeKey: `notify:${key}`,
    });
    outcome.inApp = created ? "created" : "duplicate";
  } catch (err) {
    console.error("[reminder] in-app notification failed:", err?.message || err);
    outcome.inApp = "failed";
  }

  // --- email --------------------------------------------------------------
  const emailLog = await emailRepository.claim({
    to: digest.teacher.email || "(no address on file)",
    recipient: digest.teacher._id,
    type: "duty_reminder",
    subject: `Reminder: ${digest.duties.length} exam duty/duties`,
    dedupeKey: key,
    status: "skipped_not_configured",
  });

  if (!emailLog) {
    outcome.email = "duplicate";
  } else if (!digest.teacher.email) {
    await emailRepository.markFailed(emailLog._id, "no email address on file");
    outcome.email = "no_address";
  } else {
    const sent = await emailService.sendClaimed(emailLog, {
      to: digest.teacher.email,
      type: "duty_reminder",
      data,
      optedOut: digest.teacher.emailNotifications === false,
    });
    outcome.email = sent.status;
  }

  // --- whatsapp -----------------------------------------------------------
  const waLog = await whatsappRepository.claim({
    to: phone.normalize(digest.teacher.phone).e164 || "(no number on file)",
    recipient: digest.teacher._id,
    type: "duty_reminder",
    provider: "none",
    dedupeKey: `wa:${key}`,
    status: "skipped_not_configured",
  });

  if (!waLog) {
    outcome.whatsapp = "duplicate";
  } else if (!digest.teacher.phone) {
    await whatsappRepository.markSkipped(waLog._id, "skipped_invalid_number");
    outcome.whatsapp = "no_number";
  } else {
    const sent = await whatsappService.sendClaimed(waLog, {
      to: digest.teacher.phone,
      type: "duty_reminder",
      data,
      optedOut: digest.teacher.whatsappNotifications === false,
    });
    outcome.whatsapp = sent.status;
  }

  return outcome;
};

/** Run one lead window, counting outcomes per channel. */
const runWindow = async (window, now, tickMs) => {
  const digests = await collectDigests(window, now, tickMs);

  const summary = {
    lead: window.lead,
    digests: digests.length,
    duties: 0,
    inApp: {},
    email: {},
    whatsapp: {},
  };
  for (const digest of digests) summary.duties += digest.duties.length;

  for (const digest of digests) {
    const outcome = await deliverDigest(digest);
    for (const channel of ["inApp", "email", "whatsapp"]) {
      const status = outcome[channel];
      if (status) summary[channel][status] = (summary[channel][status] || 0) + 1;
    }
  }

  return summary;
};

/**
 * Run every window.
 *
 * @param {object} [opts]
 * @param {Date}   [opts.now]     evaluation instant (tests / manual runs)
 * @param {number} [opts.tickMs]  width of the catch-up slack, in ms
 * @param {string[]} [opts.leads] restrict to specific windows
 */
const runReminders = async ({ now = new Date(), tickMs, leads } = {}) => {
  const width = tickMs ?? Number(process.env.REMINDER_TICK_MS || 15 * 60 * 1000);
  const selected = leads?.length
    ? windows.REMINDER_WINDOWS.filter((w) => leads.includes(w.lead))
    : windows.REMINDER_WINDOWS;

  const results = [];
  for (const window of selected) {
    try {
      results.push(await runWindow(window, now, width));
    } catch (err) {
      console.error(`[reminder] window ${window.lead} failed:`, err?.message || err);
      results.push({ lead: window.lead, error: err?.message || "unknown error" });
    }
  }

  // Per-channel rollup, plus a flat one so a caller that doesn't care about
  // channels still gets a usable "did anything go out?" answer.
  const channelTotals = (channel) =>
    results.reduce(
      (acc, r) => {
        const counts = r[channel] || {};
        return {
          sent: acc.sent + (counts.sent || 0) + (counts.created || 0),
          duplicate: acc.duplicate + (counts.duplicate || 0),
          failed: acc.failed + (counts.failed || 0),
          skipped:
            acc.skipped +
            (counts.skipped_not_configured || 0) +
            (counts.skipped_opted_out || 0) +
            (counts.skipped_invalid_number || 0) +
            (counts.no_address || 0) +
            (counts.no_number || 0),
        };
      },
      { sent: 0, duplicate: 0, failed: 0, skipped: 0 },
    );

  const byChannel = {
    inApp: channelTotals("inApp"),
    email: channelTotals("email"),
    whatsapp: channelTotals("whatsapp"),
  };

  const totals = {
    digests: results.reduce((n, r) => n + (r.digests || 0), 0),
    sent: byChannel.email.sent + byChannel.whatsapp.sent,
    duplicate: byChannel.email.duplicate + byChannel.whatsapp.duplicate,
    failed: byChannel.email.failed + byChannel.whatsapp.failed,
    skipped: byChannel.email.skipped + byChannel.whatsapp.skipped,
  };

  return { ranAt: now, tickMs: width, windows: results, totals, byChannel };
};

/**
 * What a run right now *would* send, without sending it.
 * Includes digests already sent, flagged so the caller can tell them apart.
 */
const previewReminders = async ({ now = new Date(), tickMs, leads } = {}) => {
  const width = tickMs ?? Number(process.env.REMINDER_TICK_MS || 15 * 60 * 1000);
  const selected = leads?.length
    ? windows.REMINDER_WINDOWS.filter((w) => leads.includes(w.lead))
    : windows.REMINDER_WINDOWS;

  const out = [];
  for (const window of selected) {
    const digests = await collectDigests(window, now, width);
    const keys = digests.map((d) =>
      windows.dedupeKeyFor(d.lead, String(d.teacher._id), d.bucket),
    );
    const alreadySent = await emailRepository.findExistingKeys(keys);

    out.push({
      lead: window.lead,
      label: window.label,
      digests: digests.map((d, i) => ({
        teacher: {
          id: String(d.teacher._id),
          name: d.teacher.name,
          email: d.teacher.email || null,
          // Masked — an admin screen needs to know a number is on file and
          // usable, not what it is.
          phone: d.teacher.phone ? phone.mask(phone.normalize(d.teacher.phone).e164) : null,
          phoneUsable: phone.normalize(d.teacher.phone).ok,
        },
        bucket: d.bucket,
        dutyCount: d.duties.length,
        duties: d.duties,
        alreadySent: alreadySent.has(keys[i]),
      })),
    });
  }

  return { evaluatedAt: now, tickMs: width, windows: out };
};

/**
 * Reminder coverage for one teacher's upcoming duties — powers the "we will
 * remind you on…" hint in the UI. Read-only.
 */
const getScheduleForTeacher = async (teacherId, { now = new Date() } = {}) => {
  const teacher = await User.findById(teacherId).select("name email emailNotifications").lean();
  if (!teacher) return null;

  const duties = await Duty.find({
    teacher: teacherId,
    status: "assigned",
    date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
  })
    .populate(POPULATE)
    .sort({ date: 1, startTime: 1 })
    .limit(100);

  const upcoming = duties
    .map((duty) => {
      const startAt = windows.dutyStartAt(duty.date, duty.startTime);
      if (!startAt || startAt < now) return null;
      return {
        ...toDutyPayload(duty),
        startAt,
        reminders: windows.REMINDER_WINDOWS.map((w) => {
          // Daily leads land at the configured send hour on their lead day;
          // the slot lead is a plain offset back from the start instant.
          const at =
            w.kind === "daily"
              ? new Date(
                  windows
                    .addDays(windows.startOfDay(startAt), -w.offsetDays)
                    .setHours(windows.dailyHour(), 0, 0, 0),
                )
              : new Date(startAt.getTime() - w.offsetMs);
          return { lead: w.lead, at, due: at > now };
        }),
      };
    })
    .filter(Boolean);

  return {
    teacher: { id: String(teacher._id), name: teacher.name, email: teacher.email || null },
    emailNotifications: teacher.emailNotifications !== false,
    upcoming,
  };
};

module.exports = {
  runReminders,
  previewReminders,
  getScheduleForTeacher,
  collectDigests,
};
