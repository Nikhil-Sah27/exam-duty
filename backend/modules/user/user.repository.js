const User = require("./user.model");

const ALLOWED_FIELDS = "name email phone roles department designation isActive createdAt updatedAt";
// Non-CS callers (e.g. an invigilator picking a swap target) get everything the
// directory UI needs to identify a colleague, minus the personal phone number.
const PUBLIC_FIELDS = "name email roles department designation isActive";

const create = (data) => {
  return User.create(data);
};

const findAll = (filter = {}, fields = ALLOWED_FIELDS) => {
  return User.find(filter).select(fields).sort({ name: 1 });
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

// Matches any user whose `roles` array contains the given role.
const countByRole = (role) => {
  return User.countDocuments({ roles: role });
};

module.exports = { create, findAll, findById, updateById, softDeleteById, countByRole, ALLOWED_FIELDS, PUBLIC_FIELDS };
