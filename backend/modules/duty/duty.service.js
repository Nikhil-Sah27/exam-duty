const mongoose = require("mongoose");
const AppError = require("../../shared/utils/AppError");
const dutyRepository = require("./duty.repository");
const Exam = require("../exam/exam.model");
const User = require("../auth/auth.model");
const { emit } = require("../notification/notification.emitter");

// ---------- Conflict validation ----------

const validateConflicts = async (teacherId, room, date, startTime, endTime, excludeId) => {
  const teacherConflict = await dutyRepository.findTeacherConflict(
    teacherId, date, startTime, endTime, excludeId
  );
  if (teacherConflict) {
    throw new AppError(
      `Teacher already has duty at ${teacherConflict.room} from ${teacherConflict.startTime}–${teacherConflict.endTime} on this date`,
      409
    );
  }

  const roomConflict = await dutyRepository.findRoomConflict(
    room, date, startTime, endTime, excludeId
  );
  if (roomConflict) {
    throw new AppError(
      `Room ${room} is already assigned to another invigilator from ${roomConflict.startTime}–${roomConflict.endTime} on this date`,
      409
    );
  }
};

const validateExam = async (examId) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new AppError("Exam not found", 404);
  if (exam.isCancelled) throw new AppError("Cannot assign duty — exam is cancelled", 400);
  if (exam.status === "completed") throw new AppError("Cannot assign duty — exam is completed", 400);
  return exam;
};

const validateTeacher = async (teacherId) => {
  const teacher = await User.findById(teacherId);
  if (!teacher) throw new AppError("Teacher not found", 404);
  if (!teacher.isActive) throw new AppError("Cannot assign duty — teacher is deactivated", 400);
  return teacher;
};

const validateTimeRange = (startTime, endTime) => {
  if (startTime >= endTime) {
    throw new AppError("End time must be after start time", 400);
  }
};

// ---------- Service methods ----------

const assignDuty = async ({ exam: examId, teacher: teacherId, room, date, startTime, endTime }, assignedById, isSelfAssigned) => {
  validateTimeRange(startTime, endTime);
  await validateExam(examId);
  await validateTeacher(teacherId);
  await validateConflicts(teacherId, room, date, startTime, endTime);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const duty = await dutyRepository.create(
      { exam: examId, teacher: teacherId, room, date, startTime, endTime, assignedBy: assignedById, isSelfAssigned },
      session
    );

    await session.commitTransaction();

    const populated = await dutyRepository.findById(duty._id);

    if (!isSelfAssigned) {
      emit("duty_assigned", {
        recipient: teacherId,
        refModel: "Duty",
        refId: duty._id,
        data: { room, date, startTime, endTime },
      });
    }

    return populated;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const selfAssignDuty = async (data, userId) => {
  return assignDuty({ ...data, teacher: userId }, userId, true);
};

const adminAssignDuty = async (data, adminId) => {
  if (!data.teacher) throw new AppError("Teacher ID is required for admin assignment", 400);
  return assignDuty(data, adminId, false);
};

const getAllDuties = async (query) => {
  const filter = {};

  if (query.exam) filter.exam = query.exam;
  if (query.teacher) filter.teacher = query.teacher;
  if (query.room) filter.room = query.room;
  if (query.status) filter.status = query.status;
  if (query.date) filter.date = new Date(query.date);

  if (query.from || query.to) {
    filter.date = filter.date || {};
    if (typeof filter.date === "object" && !(filter.date instanceof Date)) {
      if (query.from) filter.date.$gte = new Date(query.from);
      if (query.to) filter.date.$lte = new Date(query.to);
    }
  }

  return dutyRepository.findAll(filter);
};

const getDutyById = async (id) => {
  const duty = await dutyRepository.findById(id);
  if (!duty) throw new AppError("Duty not found", 404);
  return duty;
};

const cancelDuty = async (id, cancelReason) => {
  const duty = await dutyRepository.findById(id);
  if (!duty) throw new AppError("Duty not found", 404);
  if (duty.status === "cancelled") throw new AppError("Duty is already cancelled", 400);
  if (duty.status === "completed") throw new AppError("Cannot cancel a completed duty", 400);

  const updated = await dutyRepository.updateById(id, {
    status: "cancelled",
    cancelledAt: new Date(),
    cancelReason: cancelReason || null,
  });

  emit("duty_cancelled", {
    recipient: duty.teacher,
    refModel: "Duty",
    refId: duty._id,
    data: { room: duty.room, date: duty.date },
  });

  return updated;
};

module.exports = {
  selfAssignDuty,
  adminAssignDuty,
  getAllDuties,
  getDutyById,
  cancelDuty,
};
