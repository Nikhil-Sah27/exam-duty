const ExamGroup = require("../exam/examGroup.model");
const ExamSchedule = require("../exam/examSchedule.model");
const CIEPlanEntry = require("./ciePlan.model");
const Course = require("../department/course.model");
const Department = require("../department/department.model");
const Semester = require("../department/semester.model");
const AppError = require("../../shared/utils/AppError");

/**
 * Same time-overlap math used elsewhere in the codebase.
 */
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) =>
  toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);

const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
};

const validateSchedules = (schedules) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    throw new AppError("At least one course must be scheduled", 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Per-row validation
  for (const s of schedules) {
    if (!s.courseId) throw new AppError("Every scheduled row must include courseId", 400);
    if (!s.date) throw new AppError("Every scheduled row must include date", 400);
    if (!s.startTime || !s.endTime) {
      throw new AppError("Every scheduled row must include startTime and endTime", 400);
    }
    if (toMinutes(s.startTime) >= toMinutes(s.endTime)) {
      throw new AppError(`End time must be after start time for course ${s.courseId}`, 400);
    }
    const day = new Date(s.date);
    day.setHours(0, 0, 0, 0);
    if (day < today) {
      throw new AppError("Cannot schedule a SEE exam in the past", 400);
    }
  }

  // Duplicate course detection
  const seenCourses = new Set();
  for (const s of schedules) {
    if (seenCourses.has(s.courseId)) {
      throw new AppError("The same course cannot be scheduled twice", 409);
    }
    seenCourses.add(s.courseId);
  }

  // Internal overlap: two schedules in this batch on the same date with
  // overlapping windows for the same department conflict.
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];
      if (!sameDay(a.date, b.date)) continue;
      if (overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) {
        throw new AppError(
          `Schedules overlap on ${new Date(a.date).toDateString()}: ` +
            `${a.startTime}–${a.endTime} and ${b.startTime}–${b.endTime}`,
          409
        );
      }
    }
  }
};

/**
 * Create a complete SEE plan: ExamGroup (examType=SEE) + one ExamSchedule
 * per course + a CIEPlanEntry linking each schedule to (department, course).
 * Returns a courseId → scheduleId mapping the frontend uses to bridge into
 * the room-assignment phase.
 */
const createSEEPlan = async (data, userId) => {
  const { departmentId, semester, schedules } = data;

  if (!departmentId) throw new AppError("Department is required", 400);
  if (!semester) throw new AppError("Semester is required", 400);

  validateSchedules(schedules);

  const department = await Department.findById(departmentId);
  if (!department) throw new AppError("Department not found", 404);

  // Resolve the semester record — the schedule-creation step needs nothing
  // from it, but validating it exists for this department catches typos.
  const semNumber = String(semester);
  const pattern = "^(Sem(ester)?\\s*)?0?" + semNumber + "$";
  const semesterRecord = await Semester.findOne({
    department: departmentId,
    $or: [
      { name: semNumber },
      { name: { $regex: new RegExp(pattern, "i") } },
    ],
  });
  if (!semesterRecord) {
    throw new AppError(`Semester ${semester} not found for this department`, 404);
  }

  // Verify all course IDs belong to that semester (no cross-semester leakage).
  const courseIds = schedules.map((s) => s.courseId);
  const courses = await Course.find({
    _id: { $in: courseIds },
    semester: semesterRecord._id,
  });
  if (courses.length !== courseIds.length) {
    throw new AppError(
      "One or more courses do not belong to the selected department/semester",
      400,
    );
  }

  // Derive the group's date range from the schedules.
  const dates = schedules.map((s) => new Date(s.date)).sort((a, b) => a - b);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  // Duplicate detection against existing SEE groups with overlapping dates.
  const duplicate = await ExamGroup.findOne({
    examType: "SEE",
    semester: parseInt(semester, 10),
    isActive: true,
    $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
  });
  if (duplicate) {
    throw new AppError(
      `A SEE exam for Semester ${semester} already exists with overlapping dates`,
      409,
    );
  }

  const examGroup = await ExamGroup.create({
    examType: "SEE",
    semester: parseInt(semester, 10),
    startDate,
    endDate,
    createdBy: userId,
  });

  const scheduleMapping = {};

  for (const entry of schedules) {
    const schedule = await ExamSchedule.create({
      examGroup: examGroup._id,
      date: new Date(entry.date),
      startTime: entry.startTime,
      endTime: entry.endTime,
    });

    await CIEPlanEntry.create({
      examGroup: examGroup._id,
      schedule: schedule._id,
      department: departmentId,
      course: entry.courseId,
    });

    scheduleMapping[entry.courseId] = schedule._id;
  }

  return { ...examGroup.toObject(), scheduleMapping };
};

module.exports = { createSEEPlan };
