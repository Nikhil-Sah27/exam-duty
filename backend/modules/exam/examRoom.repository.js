const ExamRoom = require("./examRoom.model");

const POPULATE_FIELDS = [
  {
    path: "room",
    select: "roomNumber floor capacity building",
    populate: { path: "building", select: "name" },
  },
];

const create = (data) => {
  return ExamRoom.create(data);
};

const findBySchedule = (scheduleId) => {
  return ExamRoom.find({ schedule: scheduleId }).populate(POPULATE_FIELDS);
};

const findBySchedules = (scheduleIds) => {
  return ExamRoom.find({ schedule: { $in: scheduleIds } }).populate(POPULATE_FIELDS);
};

const findById = (id) => {
  return ExamRoom.findById(id).populate(POPULATE_FIELDS);
};

const deleteById = (id) => {
  return ExamRoom.findByIdAndDelete(id);
};

const deleteBySchedule = (scheduleId) => {
  return ExamRoom.deleteMany({ schedule: scheduleId });
};

const deleteBySchedules = (scheduleIds) => {
  return ExamRoom.deleteMany({ schedule: { $in: scheduleIds } });
};

module.exports = {
  create,
  findBySchedule,
  findBySchedules,
  findById,
  deleteById,
  deleteBySchedule,
  deleteBySchedules,
};
