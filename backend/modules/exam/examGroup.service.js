const AppError = require("../../shared/utils/AppError");
const examGroupRepo = require("./examGroup.repository");
const examScheduleRepo = require("./examSchedule.repository");
const examRoomRepo = require("./examRoom.repository");
const examDeletionService = require("../exam-cleanup/services/examDeletionService");

const ExamGroup = require("./examGroup.model");
const Duty = require("../duty/duty.model");
const CIEPlanEntry = require("../create-exams/ciePlan.model");

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

// Delegates to the centralized cascade so duties are released, change
// requests cancelled, audit logged, and teachers notified — atomically.
const deleteGroup = async (id, actor = {}) => {
  return examDeletionService.deleteExamGroupWithCleanup(id, actor);
};

/**
 * Get full details for exam group: group info + schedules + rooms per schedule.
 *
 * Each schedule additionally carries a `courses` array — one entry per
 * (department × course) that's tied to that schedule via CIEPlanEntry. The
 * UI uses this to display "what subject is being written in this room?" in
 * the room-details modal. Field is purely additive (existing consumers of
 * this endpoint ignore it).
 */
const getGroupDetails = async (id) => {
  const group = await examGroupRepo.findById(id);
  if (!group) throw new AppError("Exam group not found", 404);

  const schedules = await examScheduleRepo.findByExamGroup(id);
  const scheduleIds = schedules.map((s) => s._id);
  const allRooms = await examRoomRepo.findBySchedules(scheduleIds);

  // Pull every plan entry for this exam group in one query and group by
  // schedule. Populating the course gives us code + name without a second
  // round trip. The department ref is kept as a code via populate to match
  // the (string) codes already stored on ExamRoom.departments.
  const planEntries = await CIEPlanEntry.find({ examGroup: id })
    .populate({ path: "course", select: "code name credits courseType" })
    .populate({ path: "department", select: "code name" });

  const coursesBySchedule = new Map();
  for (const entry of planEntries) {
    const key = entry.schedule.toString();
    if (!coursesBySchedule.has(key)) coursesBySchedule.set(key, []);
    coursesBySchedule.get(key).push({
      courseId: entry.course?._id,
      courseCode: entry.course?.code || null,
      courseTitle: entry.course?.name || null,
      credits: entry.course?.credits || null,
      courseType: entry.course?.courseType || null,
      departmentCode: entry.department?.code || null,
      departmentName: entry.department?.name || null,
    });
  }

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
    courses: coursesBySchedule.get(s._id.toString()) || [],
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
    }).populate("teacher", "name email phone role department designation");

    // Populate per-role assignee info so the teacher-side modal can show the
    // owner's name, department, contact, etc. CS callers only read the boolean
    // flags below — the additional fields are additive and ignored there.
    const dcsTeacher = duties.find((d) => d.teacher?.role === "dcs")?.teacher;
    const rsTeacher = duties.find((d) => d.teacher?.role === "rs")?.teacher;
    const invigilatorTeacher = duties.find(
      (d) => d.teacher?.role === "invigilator",
    )?.teacher;

    const toPublic = (u) =>
      u
        ? {
            _id: u._id,
            name: u.name,
            email: u.email,
            phone: u.phone || null,
            role: u.role,
            department: u.department || null,
            designation: u.designation || null,
          }
        : null;

    statusMap[examRoom._id] = {
      dcsAssigned: Boolean(dcsTeacher),
      rsAssigned: Boolean(rsTeacher),
      invigilatorAssigned: Boolean(invigilatorTeacher),
      dcsTeacher: toPublic(dcsTeacher),
      rsTeacher: toPublic(rsTeacher),
      invigilatorTeacher: toPublic(invigilatorTeacher),
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
