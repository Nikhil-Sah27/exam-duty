const cieService = require("./cie.service");
const catchAsync = require("../../shared/utils/catchAsync");

const getDepartmentsData = catchAsync(async (req, res) => {
  const { departmentIds, semester } = req.query;
  const ids = departmentIds ? departmentIds.split(",") : [];
  const data = await cieService.getDepartmentsData(ids, semester);
  res.status(200).json({ success: true, data });
});

const calculateDates = catchAsync(async (req, res) => {
  const result = cieService.calculateDates(req.body);
  res.status(200).json({ success: true, data: result });
});

const createPlan = catchAsync(async (req, res) => {
  const plan = await cieService.createPlan(req.body, req.user.id);
  res.status(201).json({ success: true, data: plan });
});

const assignRooms = catchAsync(async (req, res) => {
  const rooms = await cieService.assignRooms(req.body);
  res.status(201).json({ success: true, data: rooms });
});

const getRooms = catchAsync(async (req, res) => {
  const rooms = await cieService.getRoomsGrouped();
  res.status(200).json({ success: true, data: rooms });
});

module.exports = { getDepartmentsData, calculateDates, createPlan, assignRooms, getRooms };
