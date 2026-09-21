const express = require("express");
const c = require("./department.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

router.use(protect);

// Reads stay open to any authenticated role (operational roles need department,
// semester and course context). Every write is CS-only.
const cs = requireRole("cs");

// Department CRUD
router.post("/", cs, c.create);
router.get("/", c.getAll);
router.patch("/:id", cs, c.update);
router.delete("/:id", cs, c.remove);
router.get("/:id/stats", c.getStats);

// Semesters
router.get("/:departmentId/semesters", c.getSemesters);
router.post("/semesters", cs, c.createSemester);
router.patch("/semesters/:id", cs, c.updateSemester);
router.delete("/semesters/:id", cs, c.deleteSemester);

// Elective Groups
router.get("/semesters/:semesterId/elective-groups", c.getElectiveGroups);
router.post("/elective-groups", cs, c.createElectiveGroup);
router.patch("/elective-groups/:id", cs, c.updateElectiveGroup);
router.delete("/elective-groups/:id", cs, c.deleteElectiveGroup);

// Courses
router.get("/semesters/:semesterId/courses", c.getCourses);
router.post("/courses", cs, c.createCourse);
router.patch("/courses/:id", cs, c.updateCourse);
router.delete("/courses/:id", cs, c.deleteCourse);

module.exports = router;
