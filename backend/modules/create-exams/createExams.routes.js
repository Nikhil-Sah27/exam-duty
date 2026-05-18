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
// Legacy two-step endpoints (kept for the existing seed scripts).
router.post("/cie/plan", cieController.createPlan);
router.post("/cie/assign-rooms", cieController.assignRooms);
// New single-call transactional endpoint — used by the deferred-write UI.
router.post("/cie/finalize", cieController.finalize);

// SEE workflow
router.post("/see/plan", seeController.createPlan);
router.post("/see/finalize", seeController.finalize);

module.exports = router;
