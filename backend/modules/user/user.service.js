const bcrypt = require("bcrypt");
const AppError = require("../../shared/utils/AppError");
const userRepository = require("./user.repository");

const SALT_ROUNDS = 10;

const createUser = async ({ name, email, password, phone, role, department, designation }) => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  return userRepository.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role,
    department,
    designation,
  });
};

const getAllUsers = async (query) => {
  const filter = {};

  if (query.department) filter.department = query.department;
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

  return userRepository.findAll(filter);
};

const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const updateUser = async (id, data) => {
  // Never allow password or role updates through this endpoint
  delete data.password;
  delete data.role;

  const user = await userRepository.updateById(id, data);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const deleteUser = async (id) => {
  const user = await userRepository.softDeleteById(id);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const bootstrapAdmin = async () => {
  const count = await userRepository.countByRole("cs");
  if (count > 0) {
    throw new AppError("Bootstrap admin already exists", 409);
  }

  const hashedPassword = await bcrypt.hash("Admin123", SALT_ROUNDS);

  const user = await userRepository.create({
    name: "Admin",
    email: "admin@examduty.com",
    password: hashedPassword,
    role: "cs",
  });

  // Re-fetch to apply ALLOWED_FIELDS projection (strips password)
  return userRepository.findById(user._id);
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, bootstrapAdmin };
