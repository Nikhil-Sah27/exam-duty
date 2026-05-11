const service = require("./infrastructure.service");
const catchAsync = require("../../shared/utils/catchAsync");

// ---------- Building ----------

const createBuilding = catchAsync(async (req, res) => {
  const building = await service.createBuilding(req.body);
  res.status(201).json({ success: true, data: building });
});

const getAllBuildings = catchAsync(async (req, res) => {
  const buildings = await service.getAllBuildings();
  res.status(200).json({ success: true, count: buildings.length, data: buildings });
});

const deleteBuilding = catchAsync(async (req, res) => {
  await service.deleteBuilding(req.params.id);
  res.status(200).json({ success: true, message: "Building deleted" });
});

// ---------- Room ----------

const getRooms = catchAsync(async (req, res) => {
  const rooms = await service.getRoomsByBuilding(req.params.buildingId);
  res.status(200).json({ success: true, count: rooms.length, data: rooms });
});

const createRoom = catchAsync(async (req, res) => {
  const room = await service.createRoom(req.body);
  res.status(201).json({ success: true, data: room });
});

const createRoomsBulk = catchAsync(async (req, res) => {
  const { building, rooms } = req.body;
  const result = await service.createRoomsBulk(building, rooms);
  res.status(201).json({
    success: true,
    data: result.created,
    skipped: result.skipped,
    createdCount: result.created.length,
    skippedCount: result.skipped.length,
  });
});

const updateRoom = catchAsync(async (req, res) => {
  const room = await service.updateRoom(req.params.id, req.body);
  res.status(200).json({ success: true, data: room });
});

const deleteRoom = catchAsync(async (req, res) => {
  await service.deleteRoom(req.params.id);
  res.status(200).json({ success: true, message: "Room deleted" });
});

module.exports = {
  createBuilding,
  getAllBuildings,
  deleteBuilding,
  getRooms,
  createRoom,
  createRoomsBulk,
  updateRoom,
  deleteRoom,
};
