const AppError = require("../../shared/utils/AppError");
const { withOptionalTransaction } = require("../../shared/utils/withOptionalTransaction");
const dutyRepository = require("./duty.repository");
const Exam = require("../exam/exam.model");
const User = require("../auth/auth.model");
const examScheduleRepo = require("../exam/examSchedule.repository");
const examRoomRepo = require("../exam/examRoom.repository");
const examGroupRepo = require("../exam/examGroup.repository");
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

/**
 * Validate a slot identified by (ExamSchedule._id, ExamRoom._id). Returns the
 * resolved schedule + examRoom (room populated). Throws if any link is broken
 * or the group is already completed.
 */
const validateScheduleSlot = async (scheduleId, examRoomId) => {
  if (!scheduleId) throw new AppError("examSchedule is required", 400);
  if (!examRoomId) throw new AppError("examRoom is required", 400);

  const [schedule, examRoom] = await Promise.all([
    examScheduleRepo.findById(scheduleId),
    examRoomRepo.findById(examRoomId),
  ]);

  if (!schedule) throw new AppError("Exam schedule not found", 404);
  if (!examRoom) throw new AppError("Exam room assignment not found", 404);
  if (examRoom.schedule.toString() !== scheduleId.toString()) {
    throw new AppError("Exam room does not belong to the given schedule", 400);
  }

  const group = await examGroupRepo.findById(schedule.examGroup);
  if (group) {
    const now = new Date();
    if (new Date(group.endDate) < now) {
      throw new AppError("Cannot assign duty — exam group is already completed", 400);
    }
  }

  return { schedule, examRoom };
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

/**
 * Two accepted payload shapes:
 *
 *  Legacy:  { exam, teacher, room, date, startTime, endTime }
 *           — used by older Controller flows that still reference Exam._id.
 *  New:     { examSchedule, examRoom, teacher }
 *           — used by the Invigilator self-assign flow built on the
 *             ExamGroup → ExamSchedule → ExamRoom domain. `room`, `date`,
 *             `startTime`, `endTime` are derived from the resolved schedule
 *             + examRoom and do not need to be sent.
 */
const assignDuty = async (data, assignedById, isSelfAssigned) => {
  const { exam: examId, examSchedule, examRoom, teacher: teacherId } = data;

  let scheduleRef = null;
  let examRoomRef = null;
  let room = data.room;
  let date = data.date;
  let startTime = data.startTime;
  let endTime = data.endTime;

  if (examSchedule || examRoom) {
    // New shape: ScheduleSlot path
    const resolved = await validateScheduleSlot(examSchedule, examRoom);
    scheduleRef = resolved.schedule._id;
    examRoomRef = resolved.examRoom._id;
    room = resolved.examRoom?.room?.roomNumber || "";
    date = resolved.schedule.date;
    startTime = resolved.schedule.startTime;
    endTime = resolved.schedule.endTime;
  } else if (examId) {
    // Legacy shape: Exam path
    await validateExam(examId);
  } else {
    throw new AppError(
      "Either {examSchedule, examRoom} or {exam} must be provided",
      400
    );
  }

  validateTimeRange(startTime, endTime);
  await validateTeacher(teacherId);
  await validateConflicts(teacherId, room, date, startTime, endTime);

  const duty = await withOptionalTransaction((session) =>
    dutyRepository.create(
      {
        exam: examId || null,
        examSchedule: scheduleRef,
        examRoom: examRoomRef,
        teacher: teacherId,
        room,
        date,
        startTime,
        endTime,
        assignedBy: assignedById,
        isSelfAssigned,
      },
      session
    )
  );

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
