const express = require("express");
const c = require("./infrastructure.controller");
const protect = require("../../shared/middleware/auth");

const router = express.Router();

router.use(protect);

// Buildings
router.post("/buildings", c.createBuilding);
router.get("/buildings", c.getAllBuildings);
router.delete("/buildings/:id", c.deleteBuilding);

// Rooms
router.get("/buildings/:buildingId/rooms", c.getRooms);
router.post("/rooms", c.createRoom);
router.post("/rooms/bulk", c.createRoomsBulk);
router.patch("/rooms/:id", c.updateRoom);
router.delete("/rooms/:id", c.deleteRoom);

module.exports = router;
