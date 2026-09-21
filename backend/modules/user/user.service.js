const bcrypt = require("bcrypt");
const AppError = require("../../shared/utils/AppError");
const userRepository = require("./user.repository");
const {
  enforceRolesForDesignation,
} = require("../../shared/utils/roleResolver");

const SALT_ROUNDS = 10;

const createUser = async ({
  name,
  email,
  password,
  phone,
  roles,
  role, // legacy single-value fallback from clients that haven't updated yet
  department,
  designation,
}) => {
  if (!designation) {
    throw new AppError("Designation is required", 400);
  }
  const requestedRoles = Array.isArray(roles)
    ? roles
    : role
    ? [role]
    : undefined;

  // createUser is reached only through the requireRole("cs") route, so the
  // caller is a verified admin and may grant "cs".
  const finalRoles = enforceRolesForDesignation(designation, requestedRoles, {
    allowCs: true,
  });

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  return userRepository.create({
    name,
    email,
    password: hashedPassword,
    phone,
    roles: finalRoles,
    department,
    designation,
  });
};

// `requester` is req.user. A CS admin may list the whole directory (with phone
// numbers). Any other authenticated role may only run a role-scoped lookup
// (the swap-candidate picker) and never receives phone numbers — this is what
// stops a plain invigilator from dumping the full staff directory.
const getAllUsers = async (query, requester) => {
  const isCs = requester && requester.activeRole === "cs";

  const filter = {};
  if (query.department) filter.department = String(query.department);
  if (query.role) filter.roles = String(query.role); // matches any user whose roles array contains `role`
  if (query.isActive !== undefined) filter.isActive = String(query.isActive) === "true";

  if (!isCs) {
    // Non-CS: must scope by role, cannot enumerate everyone.
    if (!query.role) {
      throw new AppError("Not authorized to list all users", 403);
    }
    return userRepository.findAll(filter, userRepository.PUBLIC_FIELDS);
  }

  return userRepository.findAll(filter);
};

const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const updateUser = async (id, data) => {
  // Never allow password updates through this endpoint.
  delete data.password;

  // If designation is being changed, re-resolve roles from it.
  if (data.designation !== undefined) {
    const requestedRoles = Array.isArray(data.roles)
      ? data.roles
      : data.role
      ? [data.role]
      : undefined;
    // updateUser is reached only through the requireRole("cs") route.
    data.roles = enforceRolesForDesignation(data.designation, requestedRoles, {
      allowCs: true,
    });
    delete data.role;
  } else {
    // Designation unchanged — do not allow direct role writes.
    delete data.role;
    delete data.roles;
  }

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
    designation: "Other",
    roles: ["cs"],
  });

  return userRepository.findById(user._id);
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, bootstrapAdmin };
