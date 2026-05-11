const express = require("express");
const c = require("./department.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

router.use(protect);

// Department CRUD
router.post("/", c.create);
router.get("/", c.getAll);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);
router.get("/:id/stats", c.getStats);

// Semesters
router.get("/:departmentId/semesters", c.getSemesters);
router.post("/semesters", c.createSemester);
router.patch("/semesters/:id", c.updateSemester);
router.delete("/semesters/:id", c.deleteSemester);

// Courses
router.get("/semesters/:semesterId/courses", c.getCourses);
router.post("/courses", c.createCourse);
router.patch("/courses/:id", c.updateCourse);
router.delete("/courses/:id", c.deleteCourse);

module.exports = router;
