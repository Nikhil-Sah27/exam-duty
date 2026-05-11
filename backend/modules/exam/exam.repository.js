const Exam = require("./exam.model");

const create = (data) => {
  return Exam.create(data);
};

const findAll = (filter = {}) => {
  return Exam.find(filter)
    .populate("createdBy", "name email")
    .sort({ date: 1 });
};

const findById = (id) => {
  return Exam.findById(id).populate("createdBy", "name email");
};

// Find by id including cancelled — needed for restore
const findByIdIncludingCancelled = (id) => {
  return Exam.findOne({ _id: id, isCancelled: true }).populate(
    "createdBy",
    "name email"
  );
};

const updateById = (id, data) => {
  return Exam.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");
};

const softDelete = (id) => {
  return Exam.findByIdAndUpdate(
    id,
    { isCancelled: true, cancelledAt: new Date() },
    { new: true }
  );
};

const restore = (id) => {
  return Exam.findOneAndUpdate(
    { _id: id, isCancelled: true },
    { isCancelled: false, cancelledAt: null },
    { new: true }
  ).populate("createdBy", "name email");
};

module.exports = {
  create,
  findAll,
  findById,
  findByIdIncludingCancelled,
  updateById,
  softDelete,
  restore,
};
