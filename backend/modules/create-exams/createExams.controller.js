const catchAsync = require("../../shared/utils/catchAsync");

const getStatus = catchAsync(async (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Create Exams module initialized" });
});

module.exports = { getStatus };
