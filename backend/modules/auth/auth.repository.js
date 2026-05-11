const User = require("./auth.model");

// Pure database operations — no logic, no transforms

const findUserByEmail = (email) => {
  return User.findOne({ email }).select("+password");
};

const createUser = (data) => {
  return User.create(data);
};

const findUserById = (id) => {
  return User.findById(id);
};

module.exports = { findUserByEmail, createUser, findUserById };
