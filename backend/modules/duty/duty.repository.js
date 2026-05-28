const Duty = require("./duty.model");

const POPULATE_FIELDS = [
  { path: "exam", select: "name date department semester type" },
  { path: "teacher", select: "name email department" },
  { path: "assignedBy", select: "name email" },
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
      select: "roomNumber floor capacity building",
      populate: { path: "building", select: "name" },
    },
  },
];

const create = (data, session) => {
  return Duty.create([data], { session }).then((docs) => docs[0]);
};

const findAll = (filter = {}) => {
  return Duty.find(filter).populate(POPULATE_FIELDS).sort({ date: 1, startTime: 1 });
};

const findById = (id) => {
  return Duty.findById(id).populate(POPULATE_FIELDS);
};

const updateById = (id, data) => {
  return Duty.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate(POPULATE_FIELDS);
};

// Conflict check: teacher already has duty at the same date/time
const findTeacherConflict = (teacherId, date, startTime, endTime, excludeId) => {
  const filter = {
    teacher: teacherId,
    date,
    status: "assigned",
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Duty.findOne(filter);
};

/**
 * Conflict check: is this room's role slot already occupied at this time?
 *
 * Each room has up to three independent role slots — DCS, RS, and Invigilator.
 * One role being filled does NOT block another (a room with a DCS supervisor
 * still needs an invigilator). When `role` is supplied, the conflict scan is
 * scoped to that role's existing duties. When omitted (legacy callers), the
 * old role-agnostic behaviour is preserved.
 *
 * Returns the first conflicting Duty (populated with the teacher's role +
 * name) so the caller can build a precise error message, or `null` if the
 * slot is free for the given role.
 */
const findRoomConflict = async (room, date, startTime, endTime, role, excludeId) => {
  const filter = {
    room,
    date,
    status: "assigned",
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeId) filter._id = { $ne: excludeId };

  // Legacy callers (no role) keep old "any role conflicts" semantics.
  if (!role) {
    return Duty.findOne(filter).populate("teacher", "name role");
  }

  // Pull every duty for this room+time, then filter by the role we're
  // checking. Cardinality is bounded by the number of distinct roles per
  // room (≤ 3), so the in-memory filter is trivial.
  const duties = await Duty.find(filter).populate("teacher", "name role");
  return duties.find((d) => d.teacher?.role === role) || null;
};

module.exports = {
  create,
  findAll,
  findById,
  updateById,
  findTeacherConflict,
  findRoomConflict,
};
