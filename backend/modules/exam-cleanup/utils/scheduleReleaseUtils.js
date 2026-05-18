// Cascade-scope resolvers. Given a deletion entry point (group / schedule /
// room / legacy exam), figure out exactly which schedules, exam-rooms, and
// duties must be touched. Pure reads — no mutations happen here.

const Duty = require("../../duty/duty.model");
const ExamSchedule = require("../../exam/examSchedule.model");
const ExamRoom = require("../../exam/examRoom.model");

const POPULATE_DUTY = [
  { path: "teacher", select: "name email role" },
  { path: "exam", select: "name semester department" },
  {
    path: "examSchedule",
    select: "date startTime endTime examGroup",
    populate: { path: "examGroup", select: "examType semester" },
  },
  {
    path: "examRoom",
    select: "room departments",
    populate: {
      path: "room",
      select: "roomNumber floor building",
      populate: { path: "building", select: "name" },
    },
  },
];

const findActiveDuties = (filter, session) => {
  const q = Duty.find({ ...filter, status: "assigned" }).populate(POPULATE_DUTY);
  return session ? q.session(session) : q;
};

const getCascadeScopeForGroup = async (groupId, session) => {
  const scheduleQuery = ExamSchedule.find({ examGroup: groupId });
  const schedules = await (session ? scheduleQuery.session(session) : scheduleQuery);
  const scheduleIds = schedules.map((s) => s._id);

  let examRoomIds = [];
  if (scheduleIds.length > 0) {
    const roomQuery = ExamRoom.find({ schedule: { $in: scheduleIds } }).select("_id");
    const rooms = await (session ? roomQuery.session(session) : roomQuery);
    examRoomIds = rooms.map((r) => r._id);
  }

  const dutyFilter = {
    $or: [
      ...(scheduleIds.length ? [{ examSchedule: { $in: scheduleIds } }] : []),
      ...(examRoomIds.length ? [{ examRoom: { $in: examRoomIds } }] : []),
    ],
  };
  const duties = dutyFilter.$or.length
    ? await findActiveDuties(dutyFilter, session)
    : [];

  return { scheduleIds, examRoomIds, duties };
};

const getCascadeScopeForSchedule = async (scheduleId, session) => {
  const roomQuery = ExamRoom.find({ schedule: scheduleId }).select("_id");
  const rooms = await (session ? roomQuery.session(session) : roomQuery);
  const examRoomIds = rooms.map((r) => r._id);

  const dutyFilter = {
    $or: [
      { examSchedule: scheduleId },
      ...(examRoomIds.length ? [{ examRoom: { $in: examRoomIds } }] : []),
    ],
  };
  const duties = await findActiveDuties(dutyFilter, session);
  return { scheduleIds: [scheduleId], examRoomIds, duties };
};

const getCascadeScopeForExamRoom = async (examRoomId, session) => {
  const duties = await findActiveDuties({ examRoom: examRoomId }, session);
  return { scheduleIds: [], examRoomIds: [examRoomId], duties };
};

// Legacy single-Exam path: duties created the old way reference `exam` directly.
// We also catch any newer ExamSchedule whose examGroup happens to map back to
// this exam — but there is no such mapping in the current schema, so we only
// scan the legacy `exam` field.
const getCascadeScopeForExam = async (examId, session) => {
  const duties = await findActiveDuties({ exam: examId }, session);
  return { scheduleIds: [], examRoomIds: [], duties };
};

module.exports = {
  getCascadeScopeForGroup,
  getCascadeScopeForSchedule,
  getCascadeScopeForExamRoom,
  getCascadeScopeForExam,
};
