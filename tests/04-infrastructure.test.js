const {
  api, setToken, test,
  assert, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n🏢 INFRASTRUCTURE TESTS\n");
  resetCounters();

  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  let buildingId = null;
  let roomId = null;
  const buildingName = `Test Building ${Date.now() % 10000}`;

  // --- Buildings ---
  await test("POST /infrastructure/buildings - create building", async () => {
    const res = await api.post("/infrastructure/buildings", {
      name: buildingName,
    });
    assertStatus(res, 201);
    buildingId = res.data.data._id || res.data.data.id;
    assertExists(buildingId, "building id");
  });

  await test("GET /infrastructure/buildings - list buildings", async () => {
    const res = await api.get("/infrastructure/buildings");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
    assert(res.data.data.length > 0, "should have buildings");
  });

  // --- Rooms ---
  await test("POST /infrastructure/rooms - create single room", async () => {
    if (!buildingId) throw new Error("No building created");
    const res = await api.post("/infrastructure/rooms", {
      roomNumber: "101-TEST",
      building: buildingId,
      floor: 1,
      capacity: 40,
    });
    assertStatus(res, 201);
    roomId = res.data.data._id || res.data.data.id;
    assertExists(roomId, "room id");
  });

  await test("POST /infrastructure/rooms/bulk - bulk create rooms", async () => {
    if (!buildingId) throw new Error("No building created");
    const res = await api.post("/infrastructure/rooms/bulk", {
      building: buildingId,
      rooms: [
        { roomNumber: "201-TEST", floor: 2, capacity: 50 },
        { roomNumber: "202-TEST", floor: 2, capacity: 45 },
        { roomNumber: "301-TEST", floor: 3, capacity: 60 },
      ],
    });
    assertStatus(res, 201);
    assertExists(res.data.data, "created rooms");
  });

  await test("POST /infrastructure/rooms/bulk - duplicate should be skipped", async () => {
    if (!buildingId) throw new Error("No building created");
    const res = await api.post("/infrastructure/rooms/bulk", {
      building: buildingId,
      rooms: [
        { roomNumber: "201-TEST", floor: 2, capacity: 50 },
      ],
    });
    assertStatus(res, 201);
  });

  await test("GET /infrastructure/buildings/:id/rooms - list rooms", async () => {
    if (!buildingId) throw new Error("No building created");
    const res = await api.get(`/infrastructure/buildings/${buildingId}/rooms`);
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
    assert(res.data.data.length >= 1, "should have rooms");
  });

  await test("PATCH /infrastructure/rooms/:id - update room capacity", async () => {
    if (!roomId) throw new Error("No room created");
    const res = await api.patch(`/infrastructure/rooms/${roomId}`, {
      capacity: 55,
    });
    assertStatus(res, 200);
  });

  await test("DELETE /infrastructure/rooms/:id - delete room", async () => {
    if (!roomId) throw new Error("No room created");
    const res = await api.delete(`/infrastructure/rooms/${roomId}`);
    assertStatus(res, 200);
  });

  await test("DELETE /infrastructure/buildings/:id - delete building", async () => {
    if (!buildingId) throw new Error("No building created");
    const res = await api.delete(`/infrastructure/buildings/${buildingId}`);
    assertStatus(res, 200);
  });

  const result = summary("INFRASTRUCTURE");
  module.exports.buildingId = buildingId;
  return result;
}

module.exports = run;
if (require.main === module) run();
