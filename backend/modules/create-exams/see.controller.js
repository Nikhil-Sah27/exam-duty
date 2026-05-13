const seeService = require("./see.service");
const catchAsync = require("../../shared/utils/catchAsync");

const createPlan = catchAsync(async (req, res) => {
  const plan = await seeService.createSEEPlan(req.body, req.user.id);
  res.status(201).json({ success: true, data: plan });
});

module.exports = { createPlan };
