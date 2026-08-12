const seatSharingService = require("./seatSharing.service");
const catchAsync = require("../../shared/utils/catchAsync");

const getAvailable = catchAsync(async (req, res) => {
  const { slots, excludeExamGroupId } = req.body || {};
  const bySlot = await seatSharingService.findShareableRoomsForSlots({
    slots: Array.isArray(slots) ? slots : [],
    excludeExamGroupId: excludeExamGroupId || null,
  });
  res.status(200).json({ success: true, data: bySlot });
});

const markShareable = catchAsync(async (req, res) => {
  const { examRoomId, initialShareableSeats } = req.body || {};
  const config = await seatSharingService.markRoomShareable({
    examRoomId,
    initialShareableSeats,
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: config });
});

const unmarkShareable = catchAsync(async (req, res) => {
  const { examRoomId } = req.body || {};
  const result = await seatSharingService.unmarkRoomShareable({ examRoomId });
  res.status(200).json({ success: true, data: result });
});

const releaseAllocation = catchAsync(async (req, res) => {
  const result = await seatSharingService.releaseSharedSeats({
    allocationId: req.params.id,
  });
  res.status(200).json({ success: true, data: result });
});

const getByExamRoom = catchAsync(async (req, res) => {
  const state = await seatSharingService.getSharingStateForExamRoom(
    req.params.examRoomId
  );
  res.status(200).json({ success: true, data: state });
});

const getBySchedule = catchAsync(async (req, res) => {
  const state = await seatSharingService.getSharingStateForSchedule(
    req.params.scheduleId
  );
  res.status(200).json({ success: true, data: state });
});

module.exports = {
  getAvailable,
  markShareable,
  unmarkShareable,
  releaseAllocation,
  getByExamRoom,
  getBySchedule,
};
