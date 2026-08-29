const express = require("express");
const controller = require("./whatsapp.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

router.use(protect);

// Every route here is operational plumbing — linking a session, sending a
// test, reading the log. All CS-only.
router.use(requireRole("cs"));

router.get("/health", controller.health);
router.get("/qr", controller.qr);
router.get("/logs", controller.logs);
router.get("/coverage", controller.coverage);
router.post("/restart", controller.restart);
router.post("/test", controller.testSend);

module.exports = router;
