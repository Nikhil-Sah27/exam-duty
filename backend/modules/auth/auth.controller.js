const authService = require("./auth.service");
const catchAsync = require("../../shared/utils/catchAsync");

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
});

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

module.exports = { register, login, getMe };
