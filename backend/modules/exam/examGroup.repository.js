const ExamGroup = require("./examGroup.model");
const ExamSchedule = require("./examSchedule.model");
const ExamRoom = require("./examRoom.model");

const create = (data) => {
  return ExamGroup.create(data);
};

const findAll = (filter = {}) => {
  return ExamGroup.find(filter)
    .populate("createdBy", "name email")
    .sort({ startDate: 1 });
};

const findById = (id) => {
  return ExamGroup.findById(id).populate("createdBy", "name email");
};

const updateById = (id, data) => {
  return ExamGroup.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");
};

const softDelete = (id) => {
  return ExamGroup.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
};

/**
 * Aggregate stats for each exam group: total schedules, total rooms
 */
const findAllWithStats = async (filter = {}) => {
  const groups = await findAll(filter);
  const groupIds = groups.map((g) => g._id);

  // Get schedule counts per group
  const scheduleCounts = await ExamSchedule.aggregate([
    { $match: { examGroup: { $in: groupIds } } },
    { $group: { _id: "$examGroup", count: { $sum: 1 } } },
  ]);

  // Get room counts per group (via schedules)
  const roomCounts = await ExamRoom.aggregate([
    {
      $lookup: {
        from: "examschedules",
        localField: "schedule",
        foreignField: "_id",
        as: "sched",
      },
    },
    { $unwind: "$sched" },
    { $match: { "sched.examGroup": { $in: groupIds } } },
    { $group: { _id: "$sched.examGroup", count: { $sum: 1 } } },
  ]);

  const scheduleMap = new Map(scheduleCounts.map((s) => [s._id.toString(), s.count]));
  const roomMap = new Map(roomCounts.map((r) => [r._id.toString(), r.count]));

  return groups.map((g) => {
    const obj = g.toObject();
    obj.totalSchedules = scheduleMap.get(g._id.toString()) || 0;
    obj.totalRooms = roomMap.get(g._id.toString()) || 0;
    return obj;
  });
};

module.exports = {
  create,
  findAll,
  findById,
  updateById,
  softDelete,
  findAllWithStats,
};
