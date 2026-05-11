const AppError = require("../../shared/utils/AppError");
const examGroupRepo = require("./examGroup.repository");
const examScheduleRepo = require("./examSchedule.repository");
const examRoomRepo = require("./examRoom.repository");

const ExamGroup = require("./examGroup.model");
const Duty = require("../duty/duty.model");

const createGroup = async (data, userId) => {
  if (new Date(data.endDate) <= new Date(data.startDate)) {
    throw new AppError("End date must be after start date", 400);
  }

  // Check for duplicate: same examType + semester + overlapping dates
  const duplicate = await ExamGroup.findOne({
    examType: data.examType,
    semester: Number(data.semester),
    isActive: true,
    $or: [
      // New exam overlaps with existing
      {
        startDate: { $lte: new Date(data.endDate) },
        endDate: { $gte: new Date(data.startDate) },
      },
    ],
  });

  if (duplicate) {
    throw new AppError(
      `An ${data.examType} exam for Semester ${data.semester} already exists with overlapping dates`,
      409
    );
  }

  return examGroupRepo.create({ ...data, createdBy: userId });
};

const getAllGroups = async (query = {}) => {
  const filter = {};
  if (query.examType) filter.examType = query.examType;
  if (query.semester) filter.semester = Number(query.semester);

  return examGroupRepo.findAllWithStats(filter);
};

const getGroupById = async (id) => {
  const group = await examGroupRepo.findById(id);
  if (!group) throw new AppError("Exam group not found", 404);
  return group;
};

const updateGroup = async (id, data) => {
  const group = await examGroupRepo.findById(id);
  if (!group) throw new AppError("Exam group not found", 404);

  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      throw new AppError("End date must be after start date", 400);
    }
  }

  return examGroupRepo.updateById(id, data);
};

const deleteGroup = async (id) => {
  const group = await examGroupRepo.findById(id);
  if (!group) throw new AppError("Exam group not found", 404);

  // Clean up related schedules and rooms
  const schedules = await examScheduleRepo.findByExamGroup(id);
  const scheduleIds = schedules.map((s) => s._id);
  if (scheduleIds.length > 0) {
    await examRoomRepo.deleteBySchedules(scheduleIds);
  }
  await examScheduleRepo.deleteByExamGroup(id);

  return examGroupRepo.softDelete(id);
};

/**
 * Get full details for exam group: group info + schedules + rooms per schedule
 */
const getGroupDetails = async (id) => {
  const group = await examGroupRepo.findById(id);
  if (!group) throw new AppError("Exam group not found", 404);

  const schedules = await examScheduleRepo.findByExamGroup(id);
  const scheduleIds = schedules.map((s) => s._id);
  const allRooms = await examRoomRepo.findBySchedules(scheduleIds);

  // Map rooms to their schedule
  const roomsBySchedule = new Map();
  for (const room of allRooms) {
    const key = room.schedule.toString();
    if (!roomsBySchedule.has(key)) roomsBySchedule.set(key, []);
    roomsBySchedule.get(key).push(room);
  }

  const schedulesWithRooms = schedules.map((s) => ({
    ...s.toObject(),
    rooms: roomsBySchedule.get(s._id.toString()) || [],
  }));

  return {
    ...group.toObject(),
    schedules: schedulesWithRooms,
  };
};

/**
 * Get duty assignment status for every room in an exam group.
 * Returns a map: { [examRoomId]: { dcsAssigned, rsAssigned, invigilatorAssigned } }
 */
const getDutyStatus = async (id) => {
  const group = await examGroupRepo.findById(id);
  if (!group) throw new AppError("Exam group not found", 404);

  const schedules = await examScheduleRepo.findByExamGroup(id);
  const scheduleIds = schedules.map((s) => s._id);
  const allRooms = await examRoomRepo.findBySchedules(scheduleIds);

  // Build a schedule lookup for quick date/time access
  const scheduleMap = new Map();
  for (const s of schedules) {
    scheduleMap.set(s._id.toString(), s);
  }

  // For each exam room, query matching duties by date + time + room identifier
  const statusMap = {};

  for (const examRoom of allRooms) {
    const schedule = scheduleMap.get(examRoom.schedule.toString());
    if (!schedule) {
      statusMap[examRoom._id] = { dcsAssigned: false, rsAssigned: false, invigilatorAssigned: false };
      continue;
    }

    // Match duties by date + time range + room number (stored as string in duty.room)
    const roomNumber = examRoom.room?.roomNumber || "";
    const roomId = examRoom.room?._id?.toString() || "";

    const scheduleDate = new Date(schedule.date);
    scheduleDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(scheduleDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const duties = await Duty.find({
      date: { $gte: scheduleDate, $lt: nextDay },
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: "assigned",
      $or: [
        { room: roomNumber },
        { room: roomId },
        { room: { $regex: new RegExp(`\\b${roomNumber}\\b`) } },
      ],
    }).populate("teacher", "role");

    const roles = new Set(duties.map((d) => d.teacher?.role).filter(Boolean));

    statusMap[examRoom._id] = {
      dcsAssigned: roles.has("dcs"),
      rsAssigned: roles.has("rs"),
      invigilatorAssigned: roles.has("invigilator"),
    };
  }

  return statusMap;
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupDetails,
  getDutyStatus,
};
