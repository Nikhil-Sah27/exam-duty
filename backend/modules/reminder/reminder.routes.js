const express = require("express");
const controller = require("./reminder.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

router.use(protect);

// Any signed-in teacher can see when they'll be reminded about their duties.
router.get("/my-schedule", controller.mySchedule);

// Operational controls are CS-only.
router.post("/run", requireRole("cs"), controller.run);
router.get("/preview", requireRole("cs"), controller.preview);
router.get("/health", requireRole("cs"), controller.health);

module.exports = router;
