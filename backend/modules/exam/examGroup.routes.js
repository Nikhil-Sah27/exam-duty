const express = require("express");
const examGroupController = require("./examGroup.controller");
const examScheduleController = require("./examSchedule.controller");
const examRoomController = require("./examRoom.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

router.use(protect);
// Reads stay open (every role's dashboards read groups, schedules, rooms and
// duty-status); structural writes are CS-only.
const cs = requireRole("cs");

// Exam Groups — collection
router.post("/", cs, examGroupController.create);
router.get("/", examGroupController.getAll);

// Exam Schedules
router.post("/schedules", cs, examScheduleController.create);
router.get("/schedules", examScheduleController.getByGroup);
router.delete("/schedules/:id", cs, examScheduleController.remove);

// Exam Rooms
router.post("/rooms", cs, examRoomController.create);
router.get("/rooms", examRoomController.getBySchedule);
router.delete("/rooms/:id", cs, examRoomController.remove);
router.post("/room-availability", examRoomController.getRoomAvailability);

// Exam Groups — by id. Express matches in registration order and "/:id"
// matches any single segment, so these must stay BELOW the literal
// "/schedules" and "/rooms" paths above or those get read as a group id.
router.get("/:id", examGroupController.getById);
router.get("/:id/details", examGroupController.getDetails);
router.get("/:id/duty-status", examGroupController.getDutyStatus);
router.patch("/:id", cs, examGroupController.update);
router.delete("/:id", cs, examGroupController.remove);

module.exports = router;
