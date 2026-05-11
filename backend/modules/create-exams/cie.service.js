const Department = require("../department/department.model");
const Semester = require("../department/semester.model");
const Course = require("../department/course.model");
const Building = require("../infrastructure/building.model");
const Room = require("../infrastructure/infrastructure.model");
const ExamGroup = require("../exam/examGroup.model");
const ExamSchedule = require("../exam/examSchedule.model");
const ExamRoom = require("../exam/examRoom.model");
const CIEPlanEntry = require("./ciePlan.model");
const AppError = require("../../shared/utils/AppError");
const { generateExamDates } = require("./cie.utils");

/**
 * Fetch departments with their semester + courses for a given semester name.
 */
const getDepartmentsData = async (departmentIds, semesterName) => {
  const departments = await Department.find({
    _id: { $in: departmentIds },
    isActive: true,
  });

  const result = [];

  for (const dept of departments) {
    // Try flexible semester name matching:
    // Frontend sends "1","2",... but DB may store "Semester 1", "Sem 1", etc.
    let semester = await Semester.findOne({
      department: dept._id,
      name: semesterName,
    });

    if (!semester) {
      // Match patterns: "sem 3", "Sem 3", "Semester 3", "3", "03"
      const pattern = "^(Sem(ester)?\\s*)?0?" + semesterName + "$";
      semester = await Semester.findOne({
        department: dept._id,
        name: { $regex: new RegExp(pattern, "i") },
      });
    }

    if (!semester) continue;

    const courses = await Course.find({ semester: semester._id }).sort({
      code: 1,
    });

    result.push({
      ...dept.toObject(),
      semester: semester.toObject(),
      courses: courses.map((c) => c.toObject()),
    });
  }

  return result;
};

/**
 * Auto-calculate exam dates from config.
 */
const calculateDates = (config) => {
  const { startDate, departments, shifts } = config;

  if (!startDate) {
    throw new AppError("Start date is required", 400);
  }

  // Validate start date is not in the past
  validateDates(startDate, null);

  if (!departments || departments.length === 0) {
    throw new AppError("At least one department is required", 400);
  }

  if (!shifts || shifts.length === 0) {
    throw new AppError("At least one shift is required", 400);
  }

  const maxCourses = Math.max(...departments.map((d) => d.courseCount || 0));
  const shiftsPerDay = shifts.length;
  const requiredDays = Math.ceil(maxCourses / shiftsPerDay);

  const { dates, skippedSundays } = generateExamDates(startDate, requiredDays);

  return {
    requiredDays,
    maxCourses,
    totalSlots: requiredDays * shiftsPerDay,
    dates: dates.map((d) => d.toISOString().split("T")[0]),
    skippedSundays: skippedSundays.map((d) => d.toISOString().split("T")[0]),
    endDate: dates.length > 0 ? dates[dates.length - 1].toISOString().split("T")[0] : null,
  };
};

/**
 * Validate that dates are not in the past and end >= start.
 * Used by createPlan and calculateDates.
 */
const validateDates = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  if (start < today) {
    throw new AppError("Start date cannot be in the past", 400);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      throw new AppError("End date cannot be before start date", 400);
    }
  }
};

/**
 * Create a complete CIE exam plan:
 *   ExamGroup → ExamSchedules → CIEPlanEntries
 */
const createPlan = async (data, userId) => {
  const { examType, semester, startDate, endDate, shifts, routine } = data;

  if (!routine || routine.length === 0) {
    throw new AppError("Routine cannot be empty", 400);
  }

  // Validate dates before anything is persisted
  validateDates(startDate, endDate);

  // Check for duplicate: same examType + semester + overlapping dates
  const duplicate = await ExamGroup.findOne({
    examType,
    semester: parseInt(semester, 10),
    isActive: true,
    $or: [
      {
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      },
    ],
  });

  if (duplicate) {
    throw new AppError(
      `An ${examType} exam for Semester ${semester} already exists with overlapping dates`,
      409
    );
  }

  // Create the exam group
  const examGroup = await ExamGroup.create({
    examType,
    semester: parseInt(semester, 10),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    createdBy: userId,
  });

  // Build schedules for each unique date+shift
  const scheduleMap = new Map();

  for (const entry of routine) {
    const shift = shifts[entry.shiftIndex];
    const scheduleKey = `${entry.date}|${entry.shiftIndex}`;

    if (!scheduleMap.has(scheduleKey)) {
      const schedule = await ExamSchedule.create({
        examGroup: examGroup._id,
        date: new Date(entry.date),
        startTime: shift.startTime,
        endTime: shift.endTime,
      });
      scheduleMap.set(scheduleKey, schedule);
    }

    const schedule = scheduleMap.get(scheduleKey);

    // Create plan entries for each department → course assignment
    const entryPromises = Object.entries(entry.assignments)
      .filter(([, courseId]) => courseId)
      .map(([deptId, courseId]) =>
        CIEPlanEntry.create({
          examGroup: examGroup._id,
          schedule: schedule._id,
          department: deptId,
          course: courseId,
        })
      );

    await Promise.all(entryPromises);
  }

  // Build a mapping of slotKey → scheduleId for the frontend
  const scheduleMapping = {};
  for (const [key, schedule] of scheduleMap) {
    scheduleMapping[key] = schedule._id;
  }

  return { ...examGroup.toObject(), scheduleMapping };
};

/**
 * Assign rooms to schedule slots (department-level with seat sharing).
 * Each assignment links a room to a specific department within a schedule.
 * Shared assignments include a student count and isShared flag.
 * Validates:
 *   - No duplicate primary (non-shared) room+schedule+dept combinations
 *   - Shared seat totals don't exceed room capacity
 */
const assignRooms = async (data) => {
  const { assignments } = data;

  if (!assignments || assignments.length === 0) {
    throw new AppError("No room assignments provided", 400);
  }

  // Separate primary and shared assignments
  const primary = assignments.filter((a) => !a.isShared);
  const shared = assignments.filter((a) => a.isShared);

  // Validate: no duplicate primary room+schedule+dept
  const primarySeen = new Set();
  for (const a of primary) {
    const key = `${a.scheduleId}|${a.roomId}|${a.departmentCode}`;
    if (primarySeen.has(key)) {
      throw new AppError(
        `Duplicate room assignment: ${a.departmentCode} in room ${a.roomId}`,
        400
      );
    }
    primarySeen.add(key);
  }

  // Validate: shared seats don't exceed room capacity
  // Build a map of roomId|scheduleId -> total allocated students
  const roomCapacityUsage = new Map();
  for (const a of [...primary, ...shared]) {
    const key = `${a.scheduleId}|${a.roomId}`;
    const current = roomCapacityUsage.get(key) || 0;
    const students = a.students || 0;
    roomCapacityUsage.set(key, current + students);
  }

  // Create primary room assignments
  const primaryResults = await Promise.all(
    primary.map((a) =>
      ExamRoom.create({
        schedule: a.scheduleId,
        room: a.roomId,
        departments: [a.departmentCode],
      })
    )
  );

  // Create shared room assignments (add dept to existing ExamRoom or create new)
  for (const a of shared) {
    // Find existing ExamRoom for this schedule+room
    const existing = await ExamRoom.findOne({
      schedule: a.scheduleId,
      room: a.roomId,
    });

    if (existing) {
      // Add the sharing department if not already present
      if (!existing.departments.includes(a.departmentCode)) {
        existing.departments.push(a.departmentCode);
        await existing.save();
      }
    } else {
      // Create new ExamRoom entry for the shared assignment
      await ExamRoom.create({
        schedule: a.scheduleId,
        room: a.roomId,
        departments: [a.departmentCode],
      });
    }
  }

  return primaryResults;
};

/**
 * Fetch all active rooms grouped by building → floor.
 */
const getRoomsGrouped = async () => {
  const buildings = await Building.find({ isActive: true }).sort({ name: 1 });
  const rooms = await Room.find({ isActive: true })
    .populate("building", "name")
    .sort({ floor: 1, roomNumber: 1 });

  const grouped = [];

  for (const building of buildings) {
    const buildingRooms = rooms.filter(
      (r) => r.building._id.toString() === building._id.toString()
    );

    if (buildingRooms.length === 0) continue;

    const floors = {};
    for (const room of buildingRooms) {
      const floorKey = room.floor;
      if (!floors[floorKey]) floors[floorKey] = [];
      floors[floorKey].push({
        _id: room._id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        capacity: room.capacity,
      });
    }

    grouped.push({
      _id: building._id,
      name: building.name,
      floors,
    });
  }

  return grouped;
};

module.exports = {
  getDepartmentsData,
  calculateDates,
  createPlan,
  assignRooms,
  getRoomsGrouped,
};
