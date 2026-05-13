const express = require("express");
const controller = require("./changeRequest.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", controller.submit);
router.get("/", controller.getAll);
router.get("/mine", controller.getMine);
router.get("/replacements/:dutyId", controller.getReplacements);
router.get("/:id", controller.getById);
router.patch("/:id/approve", controller.approve);
router.patch("/:id/reject", controller.reject);

module.exports = router;
