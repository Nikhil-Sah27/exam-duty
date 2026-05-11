const {
  api, setToken, test,
  assert, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n📋 EXAM GROUP TESTS\n");
  resetCounters();

  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  let groupId = null;
  let scheduleId = null;
  let examRoomId = null;

  // --- Create Exam Group ---
  await test("POST /exam-groups - create exam group", async () => {
    const res = await api.post("/exam-groups", {
      examType: "IA1",
      semester: 3,
      startDate: "2026-07-01",
      endDate: "2026-07-10",
    });
    assertStatus(res, 201);
    groupId = res.data.data._id || res.data.data.id;
    assertExists(groupId, "group id");
  });

  await test("GET /exam-groups - list groups", async () => {
    const res = await api.get("/exam-groups");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  await test("GET /exam-groups/:id - get group", async () => {
    if (!groupId) throw new Error("No group");
    const res = await api.get(`/exam-groups/${groupId}`);
    assertStatus(res, 200);
  });

  await test("PATCH /exam-groups/:id - update group", async () => {
    if (!groupId) throw new Error("No group");
    const res = await api.patch(`/exam-groups/${groupId}`, {
      endDate: "2026-07-12",
    });
    assertStatus(res, 200);
  });

  // --- Schedules ---
  await test("POST /exam-groups/schedules - create schedule", async () => {
    if (!groupId) throw new Error("No group");
    const res = await api.post("/exam-groups/schedules", {
      examGroup: groupId,
      date: "2026-07-02",
      startTime: "09:00",
      endTime: "12:00",
    });
    assertStatus(res, 201);
    scheduleId = res.data.data._id || res.data.data.id;
    assertExists(scheduleId, "schedule id");
  });

  await test("GET /exam-groups/schedules?examGroupId=... - list schedules", async () => {
    if (!groupId) throw new Error("No group");
    const res = await api.get(`/exam-groups/schedules?examGroupId=${groupId}`);
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- Rooms (need a real room, create temp building+room) ---
  let tempBuildingId = null;
  let tempRoomId = null;

  await test("Setup: create temp building + room for exam room test", async () => {
    const bRes = await api.post("/infrastructure/buildings", {
      name: `EG-Test-Bldg-${Date.now() % 10000}`,
    });
    tempBuildingId = bRes.data.data._id || bRes.data.data.id;

    const rRes = await api.post("/infrastructure/rooms", {
      roomNumber: `EG-R-${Date.now() % 1000}`,
      building: tempBuildingId,
      floor: 1,
      capacity: 40,
    });
    tempRoomId = rRes.data.data._id || rRes.data.data.id;
  });

  await test("POST /exam-groups/rooms - assign room to schedule", async () => {
    if (!scheduleId || !tempRoomId) throw new Error("Missing schedule or room");
    const res = await api.post("/exam-groups/rooms", {
      schedule: scheduleId,
      room: tempRoomId,
      departments: ["CSE"],
    });
    assertStatus(res, 201);
    examRoomId = res.data.data._id || res.data.data.id;
  });

  await test("GET /exam-groups/rooms?scheduleId=... - list rooms", async () => {
    if (!scheduleId) throw new Error("No schedule");
    const res = await api.get(`/exam-groups/rooms?scheduleId=${scheduleId}`);
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  await test("GET /exam-groups/:id/details - full details", async () => {
    if (!groupId) throw new Error("No group");
    const res = await api.get(`/exam-groups/${groupId}/details`);
    assertStatus(res, 200);
  });

  await test("GET /exam-groups/:id/duty-status - duty status", async () => {
    if (!groupId) throw new Error("No group");
    const res = await api.get(`/exam-groups/${groupId}/duty-status`);
    assertStatus(res, 200);
  });

  // --- Cleanup ---
  await test("DELETE /exam-groups/rooms/:id - remove room", async () => {
    if (!examRoomId) throw new Error("No exam room");
    const res = await api.delete(`/exam-groups/rooms/${examRoomId}`);
    assertStatus(res, 200);
  });

  await test("DELETE /exam-groups/schedules/:id - delete schedule", async () => {
    if (!scheduleId) throw new Error("No schedule");
    const res = await api.delete(`/exam-groups/schedules/${scheduleId}`);
    assertStatus(res, 200);
  });

  await test("DELETE /exam-groups/:id - delete group", async () => {
    if (!groupId) throw new Error("No group");
    const res = await api.delete(`/exam-groups/${groupId}`);
    assertStatus(res, 200);
  });

  // Cleanup temp infra
  if (tempBuildingId) {
    await api.delete(`/infrastructure/buildings/${tempBuildingId}`).catch(() => {});
  }

  const result = summary("EXAM GROUPS");
  return result;
}

module.exports = run;
if (require.main === module) run();
