const express = require("express");
const createExamsController = require("./createExams.controller");
const cieController = require("./cie.controller");
const seeController = require("./see.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", createExamsController.getStatus);

// CIE workflow
router.get("/cie/departments-data", cieController.getDepartmentsData);
router.post("/cie/calculate-dates", cieController.calculateDates);
router.get("/cie/rooms", cieController.getRooms);
router.post("/cie/plan", cieController.createPlan);
router.post("/cie/assign-rooms", cieController.assignRooms);

// SEE workflow — reuses /cie/departments-data and /cie/assign-rooms;
// only the plan-creation step is SEE-specific.
router.post("/see/plan", seeController.createPlan);

module.exports = router;
