const service = require("./department.service");
const catchAsync = require("../../shared/utils/catchAsync");

// ---------- Department ----------

const create = catchAsync(async (req, res) => {
  const dept = await service.createDepartment(req.body);
  res.status(201).json({ success: true, data: dept });
});

const getAll = catchAsync(async (req, res) => {
  const depts = await service.getAllDepartments();
  res.status(200).json({ success: true, count: depts.length, data: depts });
});

const update = catchAsync(async (req, res) => {
  const dept = await service.updateDepartment(req.params.id, req.body);
  res.status(200).json({ success: true, data: dept });
});

const remove = catchAsync(async (req, res) => {
  await service.deleteDepartment(req.params.id);
  res.status(200).json({ success: true, message: "Department deleted" });
});

const getStats = catchAsync(async (req, res) => {
  const stats = await service.getDepartmentStats(req.params.id);
  res.status(200).json({ success: true, data: stats });
});

// ---------- Semester ----------

const getSemesters = catchAsync(async (req, res) => {
  const semesters = await service.getSemesters(req.params.departmentId);
  res.status(200).json({ success: true, count: semesters.length, data: semesters });
});

const createSemester = catchAsync(async (req, res) => {
  const semester = await service.createSemester(req.body);
  res.status(201).json({ success: true, data: semester });
});

const updateSemester = catchAsync(async (req, res) => {
  const semester = await service.updateSemester(req.params.id, req.body);
  res.status(200).json({ success: true, data: semester });
});

const deleteSemester = catchAsync(async (req, res) => {
  await service.deleteSemester(req.params.id);
  res.status(200).json({ success: true, message: "Semester deleted" });
});

// ---------- Course ----------

const getCourses = catchAsync(async (req, res) => {
  const courses = await service.getCourses(req.params.semesterId);
  res.status(200).json({ success: true, count: courses.length, data: courses });
});

const createCourse = catchAsync(async (req, res) => {
  const course = await service.createCourse(req.body);
  res.status(201).json({ success: true, data: course });
});

const updateCourse = catchAsync(async (req, res) => {
  const course = await service.updateCourse(req.params.id, req.body);
  res.status(200).json({ success: true, data: course });
});

const deleteCourse = catchAsync(async (req, res) => {
  await service.deleteCourse(req.params.id);
  res.status(200).json({ success: true, message: "Course deleted" });
});

// ---------- Elective Group ----------

const getElectiveGroups = catchAsync(async (req, res) => {
  const groups = await service.getElectiveGroups(req.params.semesterId);
  res.status(200).json({ success: true, count: groups.length, data: groups });
});

const createElectiveGroup = catchAsync(async (req, res) => {
  const group = await service.createElectiveGroup(req.body);
  res.status(201).json({ success: true, data: group });
});

const updateElectiveGroup = catchAsync(async (req, res) => {
  const group = await service.updateElectiveGroup(req.params.id, req.body);
  res.status(200).json({ success: true, data: group });
});

const deleteElectiveGroup = catchAsync(async (req, res) => {
  await service.deleteElectiveGroup(req.params.id);
  res.status(200).json({ success: true, message: "Elective group deleted" });
});

module.exports = {
  create,
  getAll,
  update,
  remove,
  getStats,
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getElectiveGroups,
  createElectiveGroup,
  updateElectiveGroup,
  deleteElectiveGroup,
};
