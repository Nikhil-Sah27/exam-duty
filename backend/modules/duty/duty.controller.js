const dutyService = require("./duty.service");
const catchAsync = require("../../shared/utils/catchAsync");

const selfAssign = catchAsync(async (req, res) => {
  const duty = await dutyService.selfAssignDuty(req.body, req.user.id, req.user.activeRole);
  res.status(201).json({ success: true, data: duty });
});

const selfAssignGroup = catchAsync(async (req, res) => {
  const duties = await dutyService.selfAssignDutyGroup(req.body, req.user.id, req.user.activeRole);
  res.status(201).json({ success: true, count: duties.length, data: duties });
});

const adminAssign = catchAsync(async (req, res) => {
  const duty = await dutyService.adminAssignDuty(req.body, req.user.id);
  res.status(201).json({ success: true, data: duty });
});

const adminAssignGroup = catchAsync(async (req, res) => {
  const duties = await dutyService.adminAssignDutyGroup(req.body, req.user.id);
  res.status(201).json({ success: true, count: duties.length, data: duties });
});

const getAll = catchAsync(async (req, res) => {
  const duties = await dutyService.getAllDuties(req.query);
  res.status(200).json({ success: true, count: duties.length, data: duties });
});

const getById = catchAsync(async (req, res) => {
  const duty = await dutyService.getDutyById(req.params.id);
  res.status(200).json({ success: true, data: duty });
});

const cancel = catchAsync(async (req, res) => {
  const duty = await dutyService.cancelDuty(req.params.id, req.body.reason);
  res.status(200).json({ success: true, data: duty });
});

const invigilatorsForRooms = catchAsync(async (req, res) => {
  const data = await dutyService.getInvigilatorsForRooms(req.body?.examRoomIds);
  res.status(200).json({ success: true, count: data.length, data });
});

module.exports = {
  selfAssign,
  selfAssignGroup,
  adminAssign,
  adminAssignGroup,
  getAll,
  getById,
  cancel,
  invigilatorsForRooms,
};
