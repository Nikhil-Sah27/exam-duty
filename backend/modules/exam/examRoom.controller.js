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
  const summary = await examRoomService.removeRoom(req.params.id, {
    actorId: req.user.id,
    ipAddress: req.ip,
  });
  res.status(200).json({
    success: true,
    message: "Room removed from schedule",
    data: summary,
  });
});

module.exports = { create, getBySchedule, remove };
