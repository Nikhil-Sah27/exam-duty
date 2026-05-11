const examRoomService = require("./examRoom.service");
const catchAsync = require("../../shared/utils/catchAsync");

const create = catchAsync(async (req, res) => {
  const room = await examRoomService.addRoom(req.body);
  res.status(201).json({ success: true, data: room });
});

const getBySchedule = catchAsync(async (req, res) => {
  const rooms = await examRoomService.getRoomsBySchedule(req.query.scheduleId);
  res.status(200).json({ success: true, count: rooms.length, data: rooms });
});

const remove = catchAsync(async (req, res) => {
  await examRoomService.removeRoom(req.params.id);
  res.status(200).json({ success: true, message: "Room removed from schedule" });
});

module.exports = { create, getBySchedule, remove };
