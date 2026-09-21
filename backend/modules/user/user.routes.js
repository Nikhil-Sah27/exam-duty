const express = require("express");
const userController = require("./user.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

// Public — no auth required (one-time setup; self-limiting, 409 once a CS exists)
router.post("/bootstrap", userController.bootstrap);

// All remaining user routes are protected
router.use(protect);

// GET / is scoped inside the service: CS sees the full directory, other roles
// may only run a role-filtered swap-candidate lookup (no phone numbers).
router.get("/", userController.getAll);

// Everything that reads a single record or mutates the directory is CS-only.
router.post("/", requireRole("cs"), userController.create);
router.get("/:id", requireRole("cs"), userController.getById);
router.put("/:id", requireRole("cs"), userController.update);
router.delete("/:id", requireRole("cs"), userController.remove);

module.exports = router;
