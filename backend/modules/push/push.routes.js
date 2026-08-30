const express = require("express");
const controller = require("./push.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

router.use(protect);

// Device registration is every user's own business, not CS's — the phone in
// their pocket is the thing being registered, and the owner is taken from the
// JWT. So these two are deliberately not behind requireRole.
router.post("/tokens", controller.registerToken);
router.delete("/tokens", controller.deregisterToken);

// Operational plumbing — reading the channel's state and proving it works.
router.get("/health", requireRole("cs"), controller.health);
router.post("/test", requireRole("cs"), controller.testSend);

module.exports = router;
