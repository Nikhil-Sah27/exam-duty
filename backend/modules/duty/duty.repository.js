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

// Conflict check: room already occupied at same date/time
const findRoomConflict = (room, date, startTime, endTime, excludeId) => {
  const filter = {
    room,
    date,
    status: "assigned",
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Duty.findOne(filter);
};

module.exports = {
  create,
  findAll,
  findById,
  updateById,
  findTeacherConflict,
  findRoomConflict,
};
