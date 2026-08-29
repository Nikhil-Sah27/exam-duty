const {
  api, setToken, login, test, skip,
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

  // Room labels are namespaced per run: a room's role slot stays occupied
  // once claimed, so reusing fixed labels would make a second run conflict.
  const runId = Date.now() % 100000;
  const examDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  await test("Setup: create exam for duty tests", async () => {
    const res = await api.post("/exams", {
      name: "Duty Test Exam",
      date: examDate,
      department: "CSE",
      semester: 4,
      type: "internal",
    });
    examId = res.data.data._id || res.data.data.id;
  });

  // Create a teacher user
  const teacherEmail = `duty_teacher_${Date.now()}@test.com`;
  const teacherPassword = "teacher123";
  await test("Setup: create teacher user", async () => {
    const res = await api.post("/users", {
      name: "Duty Test Teacher",
      email: teacherEmail,
      password: teacherPassword,
      phone: "9876543210",
      // Assistant Professor resolves to roles [rs, invigilator].
      designation: "Assistant Professor",
    });
    teacherId = res.data.data._id || res.data.data.id;
  });

  // --- Admin Assign ---
  await test("POST /duties/admin-assign - assign duty", async () => {
    if (!examId || !teacherId) throw new Error("Missing exam or teacher");
    const res = await api.post("/duties/admin-assign", {
      exam: examId,
      teacher: teacherId,
      // The teacher holds two duty-eligible roles, so the slot is ambiguous
      // unless the assignment names it.
      role: "invigilator",
      room: `DT${runId}-101`,
      date: examDate,
      startTime: "09:00",
      endTime: "12:00",
    });
    assertStatus(res, 201);
    dutyId = res.data.data._id || res.data.data.id;
    assertExists(dutyId, "duty id");
  });

  await test("POST /duties/admin-assign - duplicate should fail (conflict)", async () => {
    if (!examId || !teacherId) throw new Error("Missing data");
    let res = null;
    try {
      res = await api.post("/duties/admin-assign", {
        exam: examId,
        teacher: teacherId,
        role: "invigilator",
        room: `DT${runId}-102`,
        date: examDate,
        startTime: "09:00",
        endTime: "12:00",
      });
    } catch (err) {
      // A bare `>= 400` would also pass on 401/404/500, none of which is the
      // conflict being tested — pin it to the teacher-conflict 409.
      assertExists(err.response, "error response");
      assertStatus(err.response, 409);
      assert(
        /already has duty/i.test(err.response.data.message),
        `Expected a teacher-conflict message, got "${err.response.data.message}"`
      );
      return;
    }
    throw new Error(`Conflicting duty was accepted with status ${res.status}`);
  });

  // --- Self Assign ---
  // CS holds no duty slot by design, so the admin token can't self-assign.
  // The claim runs as the invigilator created above and hands the token back.
  await test("POST /duties/self-assign - self assign duty", async () => {
    if (!examId) throw new Error("No exam");
    const teacherToken = await login(teacherEmail, teacherPassword, "invigilator");
    setToken(teacherToken);
    try {
      const res = await api.post("/duties/self-assign", {
        exam: examId,
        room: `DT${runId}-201`,
        date: examDate,
        startTime: "14:00",
        endTime: "17:00",
      });
      assertStatus(res, 201);
    } finally {
      setToken(token);
    }
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
