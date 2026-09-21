const express = require("express");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");
const controller = require("./dcsGroup.controller");

const router = express.Router();

router.use(protect);

router.get("/groups", controller.listGroups);
router.get("/groups/mine", controller.getMine);
router.get("/groups/:id", controller.getById);
router.get("/groups/:id/invigilators", controller.getRoomInvigilators);
// A DCS claims/releases their OWN group (claim uses activeRole; releaseGroup
// verifies the caller is the assigned DCS). admin-claim assigns on someone
// else's behalf, so it is CS-only.
router.post("/groups/:id/claim", controller.claim);
router.post("/groups/:id/admin-claim", requireRole("cs"), controller.adminClaim);
router.post("/groups/:id/release", controller.release);

module.exports = router;
