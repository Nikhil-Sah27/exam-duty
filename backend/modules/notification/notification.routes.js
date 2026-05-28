const express = require("express");
const controller = require("./notification.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", controller.getMine);
router.get("/unread-count", controller.getUnreadCount);
router.patch("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);
// DELETE /api/notifications      — wipe the caller's notifications
// DELETE /api/notifications/:id  — delete one (ownership-checked in service)
router.delete("/", controller.removeAll);
router.delete("/:id", controller.remove);

module.exports = router;
