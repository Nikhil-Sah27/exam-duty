const ChangeRequest = require("./changeRequest.model");

const POPULATE_FIELDS = [
  { path: "duty", select: "exam room date startTime endTime status" },
  { path: "requestedBy", select: "name email department" },
  { path: "swapWith", select: "name email department" },
  { path: "reviewedBy", select: "name email" },
];

// Deep populate: duty → exam, plus move-request target refs
const POPULATE_DEEP = [
  {
    path: "duty",
    select: "exam room date startTime endTime status teacher",
    populate: { path: "exam", select: "name department" },
  },
  { path: "requestedBy", select: "name email department" },
  { path: "swapWith", select: "name email department" },
  { path: "reviewedBy", select: "name email" },
  // Move-request target. The schedule + examRoom let the UI show full slot context.
  {
    path: "requestedSchedule",
    select: "date startTime endTime examGroup",
    populate: { path: "examGroup", select: "examType semester" },
  },
  {
    path: "requestedExamRoom",
    select: "room departments",
    populate: {
      path: "room",
      select: "roomNumber floor capacity building",
      populate: { path: "building", select: "name" },
    },
  },
];

const create = (data) => {
  return ChangeRequest.create(data);
};

const findAll = (filter = {}) => {
  return ChangeRequest.find(filter)
    .populate(POPULATE_DEEP)
    .sort({ createdAt: -1 });
};

const findById = (id) => {
  return ChangeRequest.findById(id).populate(POPULATE_DEEP);
};

const findPendingByDutyAndUser = (dutyId, userId) => {
  return ChangeRequest.findOne({
    duty: dutyId,
    requestedBy: userId,
    status: "pending",
  });
};

const updateById = (id, data) => {
  return ChangeRequest.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate(POPULATE_DEEP);
};

// Find pending/approved requests whose duty is in the given list. Used by the
// exam-cleanup cascade to identify open requests that must be force-cancelled
// when their underlying duty is being released.
const findOpenByDutyIds = (dutyIds, session) => {
  const query = ChangeRequest.find({
    duty: { $in: dutyIds },
    status: { $in: ["pending", "approved"] },
  });
  return session ? query.session(session) : query;
};

const updateManyByIds = (ids, data, session) => {
  return ChangeRequest.updateMany(
    { _id: { $in: ids } },
    data,
    session ? { session } : {},
  );
};

module.exports = {
  create,
  findAll,
  findById,
  findPendingByDutyAndUser,
  updateById,
  findOpenByDutyIds,
  updateManyByIds,
};
