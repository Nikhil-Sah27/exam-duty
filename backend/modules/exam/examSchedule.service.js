const AppError = require("../../shared/utils/AppError");
const examGroupRepo = require("./examGroup.repository");
const examScheduleRepo = require("./examSchedule.repository");
const examRoomRepo = require("./examRoom.repository");

const createSchedule = async (data) => {
  const group = await examGroupRepo.findById(data.examGroup);
  if (!group) throw new AppError("Exam group not found", 404);

  // Validate time range
  if (data.endTime <= data.startTime) {
    throw new AppError("End time must be after start time", 400);
  }

  // Validate date is within group range
  const schedDate = new Date(data.date);
  if (schedDate < group.startDate || schedDate > group.endDate) {
    throw new AppError("Schedule date must be within exam group date range", 400);
  }

  return examScheduleRepo.create(data);
};

const getSchedulesByGroup = async (examGroupId) => {
  return examScheduleRepo.findByExamGroup(examGroupId);
};

const deleteSchedule = async (id) => {
  const schedule = await examScheduleRepo.findById(id);
  if (!schedule) throw new AppError("Schedule not found", 404);

  // Clean up associated rooms
  await examRoomRepo.deleteBySchedule(id);
  return examScheduleRepo.deleteById(id);
};

module.exports = {
  createSchedule,
  getSchedulesByGroup,
  deleteSchedule,
};
