const {
  api, setToken, login, test, skip,
  assert, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n🔄 CHANGE REQUEST TESTS\n");
  resetCounters();

  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  let examId = null;
  let dutyId = null;
  let requestId = null;
  let teacherAId = null;
  let teacherBId = null;
  let dutyBId = null;

  // Room labels are namespaced per run so a second run doesn't collide with
  // the duties this one leaves assigned. The date has to stay in the future —
  // a change request on a past duty is rejected.
  const runId = Date.now() % 100000;
  const dutyDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const teacherPassword = "teacher123";
  const teacherAEmail = `cr_teacherA_${Date.now()}@test.com`;
  const teacherBEmail = `cr_teacherB_${Date.now()}@test.com`;

  // Setup: Create exam, two teachers, and duties
  await test("Setup: create exam + teachers + duties", async () => {
    // Exam
    const examRes = await api.post("/exams", {
      name: "Change Req Test Exam",
      date: dutyDate,
      department: "CSE",
      semester: 5,
      type: "internal",
    });
    examId = examRes.data.data._id || examRes.data.data.id;

    // Teacher A
    const tARes = await api.post("/users", {
      name: "Teacher A CR",
      email: teacherAEmail,
      password: teacherPassword,
      phone: "9876543211",
      designation: "Assistant Professor",
    });
    teacherAId = tARes.data.data._id || tARes.data.data.id;

    // Teacher B
    const tBRes = await api.post("/users", {
      name: "Teacher B CR",
      email: teacherBEmail,
      password: teacherPassword,
      phone: "9876543212",
      designation: "Assistant Professor",
    });
    teacherBId = tBRes.data.data._id || tBRes.data.data.id;

    // Duty for Teacher A
    const dutyRes = await api.post("/duties/admin-assign", {
      exam: examId,
      teacher: teacherAId,
      role: "invigilator",
      room: `CR${runId}-101`,
      date: dutyDate,
      startTime: "09:00",
      endTime: "12:00",
    });
    dutyId = dutyRes.data.data._id || dutyRes.data.data.id;
  });

  // --- Create Drop Request ---
  // Only the teacher who owns the duty may raise a request against it — the
  // admin cannot file one on their behalf. Review actions below are CS-only,
  // so the admin token is restored afterwards.
  await test("POST /change-requests - create drop request", async () => {
    if (!dutyId) throw new Error("No duty");
    const teacherToken = await login(teacherAEmail, teacherPassword, "invigilator");
    setToken(teacherToken);
    try {
      const res = await api.post("/change-requests", {
        duty: dutyId,
        type: "drop",
        reason: "Personal emergency - test",
      });
      assertStatus(res, 201);
      requestId = res.data.data._id || res.data.data.id;
      assertExists(requestId, "request id");
    } finally {
      setToken(token);
    }
  });

  // --- List All Requests ---
  await test("GET /change-requests - list all requests", async () => {
    const res = await api.get("/change-requests");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- My Requests ---
  await test("GET /change-requests/mine - my requests", async () => {
    const res = await api.get("/change-requests/mine");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- Get Request ---
  await test("GET /change-requests/:id - get request", async () => {
    if (!requestId) throw new Error("No request");
    const res = await api.get(`/change-requests/${requestId}`);
    assertStatus(res, 200);
  });

  // --- Reject Request ---
  await test("PATCH /change-requests/:id/reject - reject request", async () => {
    if (!requestId) throw new Error("No request");
    const res = await api.patch(`/change-requests/${requestId}/reject`, {
      note: "Rejected for testing purposes",
    });
    assertStatus(res, 200);
  });

  // Create another request to test approve
  let approveRequestId = null;

  await test("Setup: create another duty + drop request for approval test", async () => {
    if (!examId || !teacherBId) throw new Error("Missing data");
    const dutyRes = await api.post("/duties/admin-assign", {
      exam: examId,
      teacher: teacherBId,
      role: "invigilator",
      room: `CR${runId}-201`,
      date: dutyDate,
      startTime: "14:00",
      endTime: "17:00",
    });
    dutyBId = dutyRes.data.data._id || dutyRes.data.data.id;

    const teacherToken = await login(teacherBEmail, teacherPassword, "invigilator");
    setToken(teacherToken);
    try {
      const reqRes = await api.post("/change-requests", {
        duty: dutyBId,
        type: "drop",
        reason: "Schedule conflict - test",
      });
      approveRequestId = reqRes.data.data._id || reqRes.data.data.id;
    } finally {
      setToken(token);
    }
  });

  await test("PATCH /change-requests/:id/approve - approve request", async () => {
    if (!approveRequestId) throw new Error("No request to approve");
    const res = await api.patch(`/change-requests/${approveRequestId}/approve`, {
      note: "Approved for testing",
    });
    assertStatus(res, 200);
  });

  const result = summary("CHANGE REQUESTS");
  return result;
}

module.exports = run;
if (require.main === module) run();
