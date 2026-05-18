const AppError = require("../../shared/utils/AppError");
const examRepository = require("./exam.repository");
const examDeletionService = require("../exam-cleanup/services/examDeletionService");

const createExam = async (data, userId) => {
  return examRepository.create({ ...data, createdBy: userId });
};

const getAllExams = async (query) => {
  const filter = {};

  if (query.department) filter.department = query.department;
  if (query.semester) filter.semester = Number(query.semester);
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;

  // Date range filtering
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }

  // Include cancelled if explicitly requested
  if (query.cancelled === "true") {
    filter.isCancelled = true;
  }

  return examRepository.findAll(filter);
};

const getExamById = async (id) => {
  const exam = await examRepository.findById(id);
  if (!exam) throw new AppError("Exam not found", 404);
  return exam;
};

const updateExam = async (id, data) => {
  // Prevent updating cancelled status through general update
  delete data.isCancelled;
  delete data.cancelledAt;

  const exam = await examRepository.findById(id);
  if (!exam) throw new AppError("Exam not found", 404);

  if (exam.status === "completed") {
    throw new AppError("Cannot update a completed exam", 400);
  }

  return examRepository.updateById(id, data);
};

// Delegates to the centralized cascade for the legacy single-Exam flow.
// Releases all duties tied to this exam, cancels open change requests,
// notifies teachers, audits — atomically.
const cancelExam = async (id, actor = {}) => {
  return examDeletionService.cancelExamWithCleanup(id, actor);
};

const restoreExam = async (id) => {
  const exam = await examRepository.findByIdIncludingCancelled(id);
  if (!exam) throw new AppError("Cancelled exam not found", 404);

  return examRepository.restore(id);
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  cancelExam,
  restoreExam,
};
