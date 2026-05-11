const examGroupService = require("./examGroup.service");
const catchAsync = require("../../shared/utils/catchAsync");

const create = catchAsync(async (req, res) => {
  const group = await examGroupService.createGroup(req.body, req.user.id);
  res.status(201).json({ success: true, data: group });
});

const getAll = catchAsync(async (req, res) => {
  const groups = await examGroupService.getAllGroups(req.query);
  res.status(200).json({ success: true, count: groups.length, data: groups });
});

const getById = catchAsync(async (req, res) => {
  const group = await examGroupService.getGroupById(req.params.id);
  res.status(200).json({ success: true, data: group });
});

const getDetails = catchAsync(async (req, res) => {
  const details = await examGroupService.getGroupDetails(req.params.id);
  res.status(200).json({ success: true, data: details });
});

const update = catchAsync(async (req, res) => {
  const group = await examGroupService.updateGroup(req.params.id, req.body);
  res.status(200).json({ success: true, data: group });
});

const remove = catchAsync(async (req, res) => {
  await examGroupService.deleteGroup(req.params.id);
  res.status(200).json({ success: true, message: "Exam group deleted" });
});

const getDutyStatus = catchAsync(async (req, res) => {
  const statusMap = await examGroupService.getDutyStatus(req.params.id);
  res.status(200).json({ success: true, data: statusMap });
});

module.exports = { create, getAll, getById, getDetails, update, remove, getDutyStatus };
