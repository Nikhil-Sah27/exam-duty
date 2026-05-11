const {
  api, setToken, test,
  assert, assertEqual, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n🏫 DEPARTMENT TESTS\n");
  resetCounters();

  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  let deptId = null;
  let semesterId = null;
  let courseId = null;
  const deptCode = `TST${Date.now() % 10000}`;

  // --- Departments ---
  await test("POST /departments - create department", async () => {
    const res = await api.post("/departments", {
      name: `Test Dept ${deptCode}`,
      code: deptCode,
    });
    assertStatus(res, 201);
    deptId = res.data.data._id || res.data.data.id;
    assertExists(deptId, "department id");
  });

  await test("GET /departments - list departments", async () => {
    const res = await api.get("/departments");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
    assert(res.data.data.length > 0, "should have departments");
  });

  await test("PATCH /departments/:id - update department", async () => {
    if (!deptId) throw new Error("No dept created");
    const res = await api.patch(`/departments/${deptId}`, {
      name: `Updated Dept ${deptCode}`,
    });
    assertStatus(res, 200);
  });

  await test("GET /departments/:id/stats - get stats", async () => {
    if (!deptId) throw new Error("No dept created");
    const res = await api.get(`/departments/${deptId}/stats`);
    assertStatus(res, 200);
    assertExists(res.data.data, "stats data");
  });

  // --- Semesters ---
  await test("POST /departments/semesters - create semester", async () => {
    if (!deptId) throw new Error("No dept created");
    const res = await api.post("/departments/semesters", {
      name: "Semester 1",
      department: deptId,
      studentCount: 60,
    });
    assertStatus(res, 201);
    semesterId = res.data.data._id || res.data.data.id;
    assertExists(semesterId, "semester id");
  });

  await test("GET /departments/:id/semesters - list semesters", async () => {
    if (!deptId) throw new Error("No dept created");
    const res = await api.get(`/departments/${deptId}/semesters`);
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  await test("PATCH /departments/semesters/:id - update semester", async () => {
    if (!semesterId) throw new Error("No semester created");
    const res = await api.patch(`/departments/semesters/${semesterId}`, {
      studentCount: 65,
    });
    assertStatus(res, 200);
  });

  // --- Courses ---
  await test("POST /departments/courses - create course", async () => {
    if (!semesterId) throw new Error("No semester created");
    const res = await api.post("/departments/courses", {
      name: "Data Structures",
      code: `DS${Date.now() % 1000}`,
      credits: 4,
      semester: semesterId,
      exams: { ia1: true, ia2: true, ia3: false, see: true },
    });
    assertStatus(res, 201);
    courseId = res.data.data._id || res.data.data.id;
    assertExists(courseId, "course id");
  });

  await test("GET /departments/semesters/:id/courses - list courses", async () => {
    if (!semesterId) throw new Error("No semester created");
    const res = await api.get(`/departments/semesters/${semesterId}/courses`);
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  await test("PATCH /departments/courses/:id - update course", async () => {
    if (!courseId) throw new Error("No course created");
    const res = await api.patch(`/departments/courses/${courseId}`, {
      credits: 3,
    });
    assertStatus(res, 200);
  });

  // --- Cleanup ---
  await test("DELETE /departments/courses/:id - delete course", async () => {
    if (!courseId) throw new Error("No course created");
    const res = await api.delete(`/departments/courses/${courseId}`);
    assertStatus(res, 200);
  });

  await test("DELETE /departments/semesters/:id - delete semester", async () => {
    if (!semesterId) throw new Error("No semester created");
    const res = await api.delete(`/departments/semesters/${semesterId}`);
    assertStatus(res, 200);
  });

  await test("DELETE /departments/:id - delete department", async () => {
    if (!deptId) throw new Error("No dept created");
    const res = await api.delete(`/departments/${deptId}`);
    assertStatus(res, 200);
  });

  const result = summary("DEPARTMENTS");

  module.exports.deptId = deptId;
  module.exports.semesterId = semesterId;
  module.exports.courseId = courseId;

  return result;
}

module.exports = run;
if (require.main === module) run();
