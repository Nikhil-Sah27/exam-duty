const express = require("express");
const examController = require("./exam.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

// All exam routes are protected; reads stay open, writes are CS-only.
router.use(protect);
const cs = requireRole("cs");

router.post("/", cs, examController.create);
router.get("/", examController.getAll);
router.get("/:id", examController.getById);
router.put("/:id", cs, examController.update);
router.patch("/:id/cancel", cs, examController.cancel);
router.patch("/:id/restore", cs, examController.restore);

module.exports = router;
