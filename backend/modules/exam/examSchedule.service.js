const AppError = require("../../shared/utils/AppError");
const examGroupRepo = require("./examGroup.repository");
const examScheduleRepo = require("./examSchedule.repository");
const examRoomRepo = require("./examRoom.repository");
const examDeletionService = require("../exam-cleanup/services/examDeletionService");

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

// Delegates to the centralized cascade. Releases all duties tied to this
// schedule (or any of its exam-rooms), cancels open change requests,
// notifies teachers, audits — atomically.
const deleteSchedule = async (id, actor = {}) => {
  return examDeletionService.deleteScheduleWithCleanup(id, actor);
};

module.exports = {
  createSchedule,
  getSchedulesByGroup,
  deleteSchedule,
};
