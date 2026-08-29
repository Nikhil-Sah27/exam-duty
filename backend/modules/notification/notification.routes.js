const express = require("express");
const controller = require("./notification.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

router.use(protect);

router.get("/", controller.getMine);

// Admin broadcast — CS composes a message for a role/department slice.
// POST for the preview too: the filter selection is a body, not a query, and
// the call has no side effects despite the verb.
router.post("/broadcast/preview", requireRole("cs"), controller.previewBroadcast);
router.post("/broadcast", requireRole("cs"), controller.broadcast);

router.get("/unread-count", controller.getUnreadCount);

// Self-service channel opt-outs. Only ever touches the caller's own
// preferences — the user id comes from the JWT, not the body.
router.patch("/preferences", controller.updateChannelPreferences);
// Kept so existing clients calling the email-only path keep working.
router.patch("/preferences/email", controller.updateChannelPreferences);

router.patch("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);
// DELETE /api/notifications      — wipe the caller's notifications
// DELETE /api/notifications/:id  — delete one (ownership-checked in service)
router.delete("/", controller.removeAll);
router.delete("/:id", controller.remove);

module.exports = router;
