const express = require("express");
const c = require("./infrastructure.controller");
const protect = require("../../shared/middleware/auth");
const requireRole = require("../../shared/middleware/requireRole");

const router = express.Router();

router.use(protect);

// Reads stay open (rooms/buildings are referenced across every role's screens);
// all writes are CS-only.
const cs = requireRole("cs");

// Buildings
router.post("/buildings", cs, c.createBuilding);
router.get("/buildings", c.getAllBuildings);
router.delete("/buildings/:id", cs, c.deleteBuilding);

// Rooms
router.get("/buildings/:buildingId/rooms", c.getRooms);
router.post("/rooms", cs, c.createRoom);
router.post("/rooms/bulk", cs, c.createRoomsBulk);
router.patch("/rooms/:id", cs, c.updateRoom);
router.delete("/rooms/:id", cs, c.deleteRoom);

module.exports = router;
