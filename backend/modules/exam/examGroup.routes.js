const express = require("express");
const examGroupController = require("./examGroup.controller");
const examScheduleController = require("./examSchedule.controller");
const examRoomController = require("./examRoom.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

router.use(protect);

// Exam Groups — collection
router.post("/", examGroupController.create);
router.get("/", examGroupController.getAll);

// Exam Schedules
router.post("/schedules", examScheduleController.create);
router.get("/schedules", examScheduleController.getByGroup);
router.delete("/schedules/:id", examScheduleController.remove);

// Exam Rooms
router.post("/rooms", examRoomController.create);
router.get("/rooms", examRoomController.getBySchedule);
router.delete("/rooms/:id", examRoomController.remove);
router.post("/room-availability", examRoomController.getRoomAvailability);

// Exam Groups — by id. Express matches in registration order and "/:id"
// matches any single segment, so these must stay BELOW the literal
// "/schedules" and "/rooms" paths above or those get read as a group id.
router.get("/:id", examGroupController.getById);
router.get("/:id/details", examGroupController.getDetails);
router.get("/:id/duty-status", examGroupController.getDutyStatus);
router.patch("/:id", examGroupController.update);
router.delete("/:id", examGroupController.remove);

module.exports = router;
