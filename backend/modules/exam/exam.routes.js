const express = require("express");
const examController = require("./exam.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

// All exam routes are protected
router.use(protect);

router.post("/", examController.create);
router.get("/", examController.getAll);
router.get("/:id", examController.getById);
router.put("/:id", examController.update);
router.patch("/:id/cancel", examController.cancel);
router.patch("/:id/restore", examController.restore);

module.exports = router;
