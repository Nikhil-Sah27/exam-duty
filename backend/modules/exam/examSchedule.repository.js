const ExamSchedule = require("./examSchedule.model");

const create = (data) => {
  return ExamSchedule.create(data);
};

const findByExamGroup = (examGroupId) => {
  return ExamSchedule.find({ examGroup: examGroupId }).sort({ date: 1, startTime: 1 });
};

const findById = (id) => {
  return ExamSchedule.findById(id);
};

const updateById = (id, data) => {
  return ExamSchedule.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const deleteById = (id) => {
  return ExamSchedule.findByIdAndDelete(id);
};

const deleteByExamGroup = (examGroupId) => {
  return ExamSchedule.deleteMany({ examGroup: examGroupId });
};

module.exports = {
  create,
  findByExamGroup,
  findById,
  updateById,
  deleteById,
  deleteByExamGroup,
};
