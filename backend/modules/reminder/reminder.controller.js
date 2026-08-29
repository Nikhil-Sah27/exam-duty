const reminderService = require("./reminder.service");
const scheduler = require("./reminder.scheduler");
const emailTransport = require("../email/email.transport");
const emailRepository = require("../email/email.repository");
const catchAsync = require("../../shared/utils/catchAsync");

const parseLeads = (raw) => {
  if (!raw) return undefined;
  const list = Array.isArray(raw) ? raw : String(raw).split(",");
  return list.map((s) => s.trim()).filter(Boolean);
};

// Manual run. Safe to call repeatedly — already-sent digests dedupe out.
const run = catchAsync(async (req, res) => {
  const result = await reminderService.runReminders({
    leads: parseLeads(req.body?.leads),
    tickMs: req.body?.tickMs ? Number(req.body.tickMs) : undefined,
  });
  res.status(200).json({ success: true, data: result });
});

const preview = catchAsync(async (req, res) => {
  const result = await reminderService.previewReminders({
    leads: parseLeads(req.query?.leads),
    tickMs: req.query?.tickMs ? Number(req.query.tickMs) : undefined,
  });
  res.status(200).json({ success: true, data: result });
});

// Scheduler + SMTP health in one call — what an admin needs to answer
// "are reminders actually going out?"
const health = catchAsync(async (req, res) => {
  const [smtp, counts] = await Promise.all([
    emailTransport.verify(),
    emailRepository.countByStatus(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  ]);
  res.status(200).json({
    success: true,
    data: { scheduler: scheduler.status(), smtp, emailsLast7Days: counts },
  });
});

const mySchedule = catchAsync(async (req, res) => {
  const data = await reminderService.getScheduleForTeacher(req.user.id);
  res.status(200).json({ success: true, data });
});

module.exports = { run, preview, health, mySchedule };
