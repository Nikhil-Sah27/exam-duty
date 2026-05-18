const AppError = require("../../shared/utils/AppError");
const examScheduleRepo = require("./examSchedule.repository");
const examRoomRepo = require("./examRoom.repository");
const examDeletionService = require("../exam-cleanup/services/examDeletionService");

const addRoom = async (data) => {
  const schedule = await examScheduleRepo.findById(data.schedule);
  if (!schedule) throw new AppError("Schedule not found", 404);

  return examRoomRepo.create(data);
};

const getRoomsBySchedule = async (scheduleId) => {
  return examRoomRepo.findBySchedule(scheduleId);
};

// Delegates to the centralized cascade. Releases all duties at this room,
// cancels open change requests, notifies teachers, audits — atomically.
const removeRoom = async (id, actor = {}) => {
  return examDeletionService.deleteExamRoomWithCleanup(id, actor);
};

module.exports = {
  addRoom,
  getRoomsBySchedule,
  removeRoom,
};
