const ChangeRequest = require("./changeRequest.model");

const POPULATE_FIELDS = [
  { path: "duty", select: "exam room date startTime endTime status" },
  { path: "requestedBy", select: "name email department" },
  { path: "swapWith", select: "name email department" },
  { path: "reviewedBy", select: "name email" },
];

// Deep populate: duty → exam
const POPULATE_DEEP = [
  {
    path: "duty",
    select: "exam room date startTime endTime status teacher",
    populate: { path: "exam", select: "name department" },
  },
  { path: "requestedBy", select: "name email department" },
  { path: "swapWith", select: "name email department" },
  { path: "reviewedBy", select: "name email" },
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

module.exports = {
  create,
  findAll,
  findById,
  findPendingByDutyAndUser,
  updateById,
};
