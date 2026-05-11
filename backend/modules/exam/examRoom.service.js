const AppError = require("../../shared/utils/AppError");
const examScheduleRepo = require("./examSchedule.repository");
const examRoomRepo = require("./examRoom.repository");

const addRoom = async (data) => {
  const schedule = await examScheduleRepo.findById(data.schedule);
  if (!schedule) throw new AppError("Schedule not found", 404);

  return examRoomRepo.create(data);
};

const getRoomsBySchedule = async (scheduleId) => {
  return examRoomRepo.findBySchedule(scheduleId);
};

const removeRoom = async (id) => {
  const room = await examRoomRepo.findById(id);
  if (!room) throw new AppError("Exam room not found", 404);

  return examRoomRepo.deleteById(id);
};

module.exports = {
  addRoom,
  getRoomsBySchedule,
  removeRoom,
};
