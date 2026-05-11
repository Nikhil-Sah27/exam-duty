const express = require("express");
const controller = require("./audit.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

router.use(protect);

// Routes will be implemented later

module.exports = router;
