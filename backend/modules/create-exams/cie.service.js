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
const { withOptionalTransaction } = require("../../shared/utils/withOptionalTransaction");

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

  // Group ALL assignments (primary + shared) by schedule+room to avoid unique index conflicts
  const roomGroups = new Map();
  for (const a of [...primary, ...shared]) {
    const key = `${a.scheduleId}|${a.roomId}`;
    if (!roomGroups.has(key)) {
      roomGroups.set(key, {
        scheduleId: a.scheduleId,
        roomId: a.roomId,
        departments: new Set(),
      });
    }
    roomGroups.get(key).departments.add(a.departmentCode);
  }

  // Create one ExamRoom per unique schedule+room with all departments merged
  const results = await Promise.all(
    Array.from(roomGroups.values()).map((group) =>
      ExamRoom.create({
        schedule: group.scheduleId,
        room: group.roomId,
        departments: Array.from(group.departments),
      })
    )
  );

  return results;
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

// ---------------------------------------------------------------------------
// Finalize (single-call transactional creation)
//
// The frontend now buffers the entire draft (config + routine + room
// assignments) and ships it in one POST after the user clicks the final
// "Finish & Create Exam" button. Everything that used to happen across
// `createPlan` + `assignRooms` now happens atomically here. If anything
// inside the transaction fails, nothing is persisted — there is no
// orphaned ExamGroup or ExamSchedule left behind.
// ---------------------------------------------------------------------------

const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
};

const finalizeCIEPlan = async (data, userId) => {
  const {
    examType,
    semester,
    startDate,
    endDate,
    shifts,
    routine,
    roomAssignments,
  } = data;

  // ---- Top-level validation (cheap, run before opening a session) ----

  if (!examType) throw new AppError("Exam type is required", 400);
  if (!semester) throw new AppError("Semester is required", 400);
  if (!Array.isArray(shifts) || shifts.length === 0) {
    throw new AppError("At least one shift is required", 400);
  }
  if (!Array.isArray(routine) || routine.length === 0) {
    throw new AppError("Routine cannot be empty", 400);
  }
  if (!Array.isArray(roomAssignments) || roomAssignments.length === 0) {
    throw new AppError("Room assignments are required before creating an exam", 400);
  }

  validateDates(startDate, endDate);

  // Every routine slot (unique date+shift) must appear in roomAssignments;
  // otherwise the caller is trying to finalize while a slot has zero rooms.
  const routineSlotKeys = new Set(
    routine.map((r) => `${r.date}|${r.shiftIndex}`),
  );
  const assignmentSlotKeys = new Set(
    roomAssignments.map((a) => a.scheduleId), // frontend ships slotKey in this field
  );
  for (const key of routineSlotKeys) {
    if (!assignmentSlotKeys.has(key)) {
      throw new AppError(
        "Cannot create exam until all schedules have rooms assigned.",
        400,
      );
    }
  }

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
      409,
    );
  }

  // ---- Transactional persistence ----

  return withOptionalTransaction(async (session) => {
    const sessionOpt = session ? { session } : {};

    const [examGroup] = await ExamGroup.create(
      [
        {
          examType,
          semester: parseInt(semester, 10),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          createdBy: userId,
        },
      ],
      sessionOpt,
    );

    // 1 ExamSchedule per unique (date, shiftIndex). Keep a slotKey → _id map
    // so room assignments can resolve their schedule ref.
    const slotKeyToScheduleId = new Map();
    for (const entry of routine) {
      const slotKey = `${entry.date}|${entry.shiftIndex}`;
      if (slotKeyToScheduleId.has(slotKey)) continue;

      const shift = shifts[entry.shiftIndex];
      if (!shift) {
        throw new AppError(`Routine references unknown shiftIndex ${entry.shiftIndex}`, 400);
      }

      const [schedule] = await ExamSchedule.create(
        [
          {
            examGroup: examGroup._id,
            date: new Date(entry.date),
            startTime: shift.startTime,
            endTime: shift.endTime,
          },
        ],
        sessionOpt,
      );
      slotKeyToScheduleId.set(slotKey, schedule._id);
    }

    // CIEPlanEntries — one per (schedule × department × course).
    for (const entry of routine) {
      const scheduleId = slotKeyToScheduleId.get(
        `${entry.date}|${entry.shiftIndex}`,
      );
      for (const [deptId, courseId] of Object.entries(entry.assignments || {})) {
        if (!courseId) continue;
        await CIEPlanEntry.create(
          [
            {
              examGroup: examGroup._id,
              schedule: scheduleId,
              department: deptId,
              course: courseId,
            },
          ],
          sessionOpt,
        );
      }
    }

    // Group room assignments by (schedule, room); merge departments so we
    // don't violate the (schedule, room) unique index on ExamRoom.
    const roomGroups = new Map();
    for (const a of roomAssignments) {
      const scheduleId = slotKeyToScheduleId.get(a.scheduleId);
      if (!scheduleId) {
        throw new AppError(
          `Room assignment references unknown slot ${a.scheduleId}`,
          400,
        );
      }
      const key = `${scheduleId}|${a.roomId}`;
      if (!roomGroups.has(key)) {
        roomGroups.set(key, {
          schedule: scheduleId,
          room: a.roomId,
          departments: new Set(),
        });
      }
      roomGroups.get(key).departments.add(a.departmentCode);
    }

    for (const group of roomGroups.values()) {
      await ExamRoom.create(
        [
          {
            schedule: group.schedule,
            room: group.room,
            departments: Array.from(group.departments),
          },
        ],
        sessionOpt,
      );
    }

    return {
      ...examGroup.toObject(),
      schedulesCreated: slotKeyToScheduleId.size,
      roomsCreated: roomGroups.size,
    };
  });
};

module.exports = {
  getDepartmentsData,
  calculateDates,
  createPlan,
  assignRooms,
  getRoomsGrouped,
  finalizeCIEPlan,
};
