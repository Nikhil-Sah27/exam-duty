const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../../shared/utils/AppError");
const authRepository = require("./auth.repository");

const SALT_ROUNDS = 10;

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const toUserDTO = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = async ({ name, email, password, role }) => {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await authRepository.createUser({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return { user: toUserDTO(user), token: generateToken(user._id) };
};

const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  return { user: toUserDTO(user), token: generateToken(user._id) };
};

const getUserById = async (id) => {
  const user = await authRepository.findUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toUserDTO(user);
};

module.exports = { register, login, getUserById };
