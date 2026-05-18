const examService = require("./exam.service");
const catchAsync = require("../../shared/utils/catchAsync");

const create = catchAsync(async (req, res) => {
  const exam = await examService.createExam(req.body, req.user.id);
  res.status(201).json({ success: true, data: exam });
});

const getAll = catchAsync(async (req, res) => {
  const exams = await examService.getAllExams(req.query);
  res.status(200).json({ success: true, count: exams.length, data: exams });
});

const getById = catchAsync(async (req, res) => {
  const exam = await examService.getExamById(req.params.id);
  res.status(200).json({ success: true, data: exam });
});

const update = catchAsync(async (req, res) => {
  const exam = await examService.updateExam(req.params.id, req.body);
  res.status(200).json({ success: true, data: exam });
});

const cancel = catchAsync(async (req, res) => {
  const summary = await examService.cancelExam(req.params.id, {
    actorId: req.user.id,
    ipAddress: req.ip,
  });
  res.status(200).json({
    success: true,
    message: "Exam cancelled",
    data: summary,
  });
});

const restore = catchAsync(async (req, res) => {
  const exam = await examService.restoreExam(req.params.id);
  res.status(200).json({ success: true, data: exam });
});

module.exports = { create, getAll, getById, update, cancel, restore };
