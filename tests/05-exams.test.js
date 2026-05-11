const {
  api, setToken, test,
  assert, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n📝 EXAM TESTS\n");
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

  // --- Create Exam ---
  await test("POST /exams - create exam", async () => {
    const res = await api.post("/exams", {
      name: "Test Exam DS",
      date: "2026-06-15",
      department: "CSE",
      semester: 3,
      type: "internal",
    });
    assertStatus(res, 201);
    examId = res.data.data._id || res.data.data.id;
    assertExists(examId, "exam id");
  });

  // --- List Exams ---
  await test("GET /exams - list all exams", async () => {
    const res = await api.get("/exams");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  await test("GET /exams?type=internal - filter by type", async () => {
    const res = await api.get("/exams?type=internal");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  await test("GET /exams?semester=3 - filter by semester", async () => {
    const res = await api.get("/exams?semester=3");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- Get Exam ---
  await test("GET /exams/:id - get exam by ID", async () => {
    if (!examId) throw new Error("No exam created");
    const res = await api.get(`/exams/${examId}`);
    assertStatus(res, 200);
    assertExists(res.data.data.name, "exam name");
  });

  // --- Update Exam ---
  await test("PUT /exams/:id - update exam", async () => {
    if (!examId) throw new Error("No exam created");
    const res = await api.put(`/exams/${examId}`, {
      name: "Updated Exam DS",
      date: "2026-06-20",
    });
    assertStatus(res, 200);
  });

  // --- Cancel Exam ---
  await test("PATCH /exams/:id/cancel - cancel exam", async () => {
    if (!examId) throw new Error("No exam created");
    const res = await api.patch(`/exams/${examId}/cancel`);
    assertStatus(res, 200);
  });

  // --- Restore Exam ---
  await test("PATCH /exams/:id/restore - restore cancelled exam", async () => {
    if (!examId) throw new Error("No exam created");
    const res = await api.patch(`/exams/${examId}/restore`);
    assertStatus(res, 200);
  });

  const result = summary("EXAMS");
  module.exports.examId = examId;
  return result;
}

module.exports = run;
module.exports.examId = null;
if (require.main === module) run();
