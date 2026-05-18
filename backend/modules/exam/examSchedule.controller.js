const examScheduleService = require("./examSchedule.service");
const catchAsync = require("../../shared/utils/catchAsync");

const create = catchAsync(async (req, res) => {
  const schedule = await examScheduleService.createSchedule(req.body);
  res.status(201).json({ success: true, data: schedule });
});

const getByGroup = catchAsync(async (req, res) => {
  const schedules = await examScheduleService.getSchedulesByGroup(req.query.examGroupId);
  res.status(200).json({ success: true, count: schedules.length, data: schedules });
});

const remove = catchAsync(async (req, res) => {
  const summary = await examScheduleService.deleteSchedule(req.params.id, {
    actorId: req.user.id,
    ipAddress: req.ip,
  });
  res.status(200).json({
    success: true,
    message: "Schedule deleted",
    data: summary,
  });
});

module.exports = { create, getByGroup, remove };
