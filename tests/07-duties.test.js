const {
  api, setToken, test, skip,
  assert, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n📌 DUTY TESTS\n");
  resetCounters();

  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  // We need an exam to assign duties to. Create one.
  let examId = null;
  let teacherId = null;
  let dutyId = null;

  await test("Setup: create exam for duty tests", async () => {
    const res = await api.post("/exams", {
      name: "Duty Test Exam",
      date: "2026-08-01",
      department: "CSE",
      semester: 4,
      type: "internal",
    });
    examId = res.data.data._id || res.data.data.id;
  });

  // Create a teacher user
  const teacherEmail = `duty_teacher_${Date.now()}@test.com`;
  await test("Setup: create teacher user", async () => {
    const res = await api.post("/users", {
      name: "Duty Test Teacher",
      email: teacherEmail,
      password: "teacher123",
      role: "invigilator",
    });
    teacherId = res.data.data._id || res.data.data.id;
  });

  // --- Admin Assign ---
  await test("POST /duties/admin-assign - assign duty", async () => {
    if (!examId || !teacherId) throw new Error("Missing exam or teacher");
    const res = await api.post("/duties/admin-assign", {
      exam: examId,
      teacher: teacherId,
      room: "101",
      date: "2026-08-01",
      startTime: "09:00",
      endTime: "12:00",
    });
    assertStatus(res, 201);
    dutyId = res.data.data._id || res.data.data.id;
    assertExists(dutyId, "duty id");
  });

  await test("POST /duties/admin-assign - duplicate should fail (conflict)", async () => {
    if (!examId || !teacherId) throw new Error("Missing data");
    try {
      await api.post("/duties/admin-assign", {
        exam: examId,
        teacher: teacherId,
        room: "102",
        date: "2026-08-01",
        startTime: "09:00",
        endTime: "12:00",
      });
      throw new Error("Should fail - teacher conflict");
    } catch (err) {
      assert(err.response && err.response.status >= 400, "Should return 4xx");
    }
  });

  // --- Self Assign ---
  await test("POST /duties/self-assign - self assign duty", async () => {
    if (!examId) throw new Error("No exam");
    const res = await api.post("/duties/self-assign", {
      exam: examId,
      room: "201",
      date: "2026-08-01",
      startTime: "14:00",
      endTime: "17:00",
    });
    assertStatus(res, 201);
  });

  // --- List Duties ---
  await test("GET /duties - list all duties", async () => {
    const res = await api.get("/duties");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  await test("GET /duties?status=assigned - filter by status", async () => {
    const res = await api.get("/duties?status=assigned");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- Get Duty ---
  await test("GET /duties/:id - get duty", async () => {
    if (!dutyId) throw new Error("No duty");
    const res = await api.get(`/duties/${dutyId}`);
    assertStatus(res, 200);
    assertExists(res.data.data.room, "room");
  });

  // --- Cancel Duty ---
  await test("PATCH /duties/:id/cancel - cancel duty", async () => {
    if (!dutyId) throw new Error("No duty");
    const res = await api.patch(`/duties/${dutyId}/cancel`, {
      reason: "Test cancellation",
    });
    assertStatus(res, 200);
  });

  const result = summary("DUTIES");
  module.exports.examId = examId;
  module.exports.dutyId = dutyId;
  module.exports.teacherId = teacherId;
  return result;
}

module.exports = run;
module.exports.examId = null;
module.exports.dutyId = null;
module.exports.teacherId = null;
if (require.main === module) run();
