const express = require("express");
const dutyController = require("./duty.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

// All duty routes are protected
router.use(protect);
const cs = requireRole("cs");

// self-assign* stamp the caller's own activeRole. admin-assign* act on another
// teacher, so they are CS-only.
router.post("/self-assign", dutyController.selfAssign);
router.post("/self-assign-group", dutyController.selfAssignGroup);
router.post("/admin-assign", cs, dutyController.adminAssign);
router.post("/admin-assign-group", cs, dutyController.adminAssignGroup);
router.post("/invigilators-for-rooms", dutyController.invigilatorsForRooms);
// getAll / getById / cancel are scoped to the caller inside the service: a
// non-CS role only ever sees or cancels its own duties.
router.get("/", dutyController.getAll);
router.get("/:id", dutyController.getById);
router.patch("/:id/cancel", dutyController.cancel);

module.exports = router;
