const express = require("express");
const controller = require("./seatSharing.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();
router.use(protect);

// Discovery — the create-exams UI queries this to surface "Use Shared Seats"
// banners on new exams that overlap someone else's shareable room.
router.post("/available", controller.getAvailable);

// Post-hoc marking (endpoint only; the create-exams flow does this transactionally).
router.post("/mark-shareable", controller.markShareable);
router.post("/unmark-shareable", controller.unmarkShareable);

// Release a specific allocation (used by consumer edits / undo).
router.delete("/allocations/:id", controller.releaseAllocation);

// Read helpers for ExamDetails read-only badges.
router.get("/by-exam-room/:examRoomId", controller.getByExamRoom);
router.get("/by-schedule/:scheduleId", controller.getBySchedule);

module.exports = router;
