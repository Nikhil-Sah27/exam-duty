const mongoose = require("mongoose");
const AppError = require("../../shared/utils/AppError");
const repo = require("./department.repository");

// ---------- Department ----------

const createDepartment = async ({ name, code }) => {
  return repo.createDept({ name, code });
};

const getAllDepartments = async () => {
  return repo.findAllDepts();
};

const updateDepartment = async (id, data) => {
  const dept = await repo.updateDept(id, data);
  if (!dept) throw new AppError("Department not found", 404);
  return dept;
};

const deleteDepartment = async (id) => {
  const dept = await repo.deleteDept(id);
  if (!dept) throw new AppError("Department not found", 404);
  return dept;
};

const getDepartmentStats = async (id) => {
  const dept = await repo.findDeptById(id);
  if (!dept) throw new AppError("Department not found", 404);

  const objectId = new mongoose.Types.ObjectId(id);

  const [totalSemesters, totalCourses, totalStudents] = await Promise.all([
    repo.countSemestersByDept(objectId),
    repo.countCoursesByDept(objectId),
    repo.sumStudentsByDept(objectId),
  ]);

  return { totalStudents, totalSemesters, totalCourses };
};

// ---------- Semester ----------

const getSemesters = async (departmentId) => {
  const dept = await repo.findDeptById(departmentId);
  if (!dept) throw new AppError("Department not found", 404);
  return repo.findSemestersByDept(departmentId);
};

const createSemester = async ({ name, department, studentCount }) => {
  const dept = await repo.findDeptById(department);
  if (!dept) throw new AppError("Department not found", 404);
  return repo.createSemester({ name, department, studentCount });
};

const updateSemester = async (id, data) => {
  const semester = await repo.updateSemester(id, data);
  if (!semester) throw new AppError("Semester not found", 404);
  return semester;
};

const deleteSemester = async (id) => {
  const semester = await repo.findSemesterById(id);
  if (!semester) throw new AppError("Semester not found", 404);
  await repo.deleteSemester(id);
};

// ---------- Course ----------

const getCourses = async (semesterId) => {
  const sem = await repo.findSemesterById(semesterId);
  if (!sem) throw new AppError("Semester not found", 404);
  return repo.findCoursesBySemester(semesterId);
};

const createCourse = async ({ name, code, credits, semester, exams }) => {
  const sem = await repo.findSemesterById(semester);
  if (!sem) throw new AppError("Semester not found", 404);
  return repo.createCourse({ name, code, credits, semester, exams });
};

const updateCourse = async (id, data) => {
  const course = await repo.updateCourse(id, data);
  if (!course) throw new AppError("Course not found", 404);
  return course;
};

const deleteCourse = async (id) => {
  const course = await repo.findCourseById(id);
  if (!course) throw new AppError("Course not found", 404);
  await repo.deleteCourse(id);
};

module.exports = {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};
