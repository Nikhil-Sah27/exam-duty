const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("./auth.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");
const allowUnselectedRole = require("../../shared/middleware/allowUnselectedRole");

const router = express.Router();

// Throttle credential submission to blunt password brute-forcing. Only FAILED
// logins count toward the window (skipSuccessfulRequests), so a real user — even
// on a shared campus NAT where many people share one public IP — is never
// locked out by their own successful sign-ins; only a run of wrong passwords is.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many attempts — try again later" },
});

// Creating a user is an administrative action, not public self-signup. Guarded
// as CS-only so no anonymous caller can register an account (let alone an admin,
// which the roleResolver also blocks). New users are created here or via /users.
router.post("/register", protect, requireRole("cs"), authController.register);
router.post("/login", loginLimiter, authController.login);
// Uses a special middleware that accepts tokens without an activeRole claim,
// since this endpoint is what turns a tempToken into a full token.
router.post("/select-role", allowUnselectedRole, authController.selectRole);
router.get("/me", protect, authController.getMe);

module.exports = router;
