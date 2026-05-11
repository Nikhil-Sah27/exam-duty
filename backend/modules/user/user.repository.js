const User = require("./user.model");

const ALLOWED_FIELDS = "name email phone role department designation isActive createdAt updatedAt";

const create = (data) => {
  return User.create(data);
};

const findAll = (filter = {}) => {
  return User.find(filter).select(ALLOWED_FIELDS).sort({ name: 1 });
};

const findById = (id) => {
  return User.findById(id).select(ALLOWED_FIELDS);
};

const updateById = (id, data) => {
  return User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).select(ALLOWED_FIELDS);
};

const softDeleteById = (id) => {
  return User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).select(ALLOWED_FIELDS);
};

const countByRole = (role) => {
  return User.countDocuments({ role });
};

module.exports = { create, findAll, findById, updateById, softDeleteById, countByRole };
