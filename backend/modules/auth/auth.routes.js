const express = require("express");
const authController = require("./auth.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

// Only routing — no logic

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe);

module.exports = router;
