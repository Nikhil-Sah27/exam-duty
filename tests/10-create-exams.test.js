const {
  api, setToken, test, skip,
  assert, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n🎓 CREATE EXAMS (CIE) TESTS\n");
  resetCounters();

  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  // --- Status Check ---
  await test("GET /create-exams - module status", async () => {
    const res = await api.get("/create-exams");
    assertStatus(res, 200);
  });

  // We need departments with semesters & courses for a full test.
  // Create them first.
  let deptId = null;
  let semId = null;
  let courseId = null;
  const deptCode = `CIE${Date.now() % 10000}`;

  await test("Setup: create dept + semester + course", async () => {
    const dRes = await api.post("/departments", {
      name: `CIE Test Dept ${deptCode}`,
      code: deptCode,
    });
    deptId = dRes.data.data._id || dRes.data.data.id;

    const sRes = await api.post("/departments/semesters", {
      name: "Semester 3",
      department: deptId,
      studentCount: 60,
    });
    semId = sRes.data.data._id || sRes.data.data.id;

    const cRes = await api.post("/departments/courses", {
      name: "CIE Test Course",
      code: `CTC${Date.now() % 1000}`,
      credits: 3,
      semester: semId,
      exams: { ia1: true, ia2: false, ia3: false, see: false },
    });
    courseId = cRes.data.data._id || cRes.data.data.id;
  });

  // --- Departments Data ---
  await test("GET /create-exams/cie/departments-data - fetch dept data", async () => {
    if (!deptId) throw new Error("No dept");
    const res = await api.get(
      `/create-exams/cie/departments-data?departmentIds=${deptId}&semester=Semester 3`
    );
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- Calculate Dates ---
  await test("POST /create-exams/cie/calculate-dates - auto calculate", async () => {
    const res = await api.post("/create-exams/cie/calculate-dates", {
      startDate: "2026-07-01",
      departments: [{ courseCount: 5 }],
      shifts: [
        { startTime: "09:00", endTime: "12:00" },
        { startTime: "14:00", endTime: "17:00" },
      ],
    });
    assertStatus(res, 200);
    assertExists(res.data.data.requiredDays, "requiredDays");
    assertExists(res.data.data.endDate, "endDate");
  });

  // --- Get Rooms ---
  await test("GET /create-exams/cie/rooms - get available rooms", async () => {
    const res = await api.get("/create-exams/cie/rooms");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- Create Plan ---
  await test("POST /create-exams/cie/plan - create exam plan", async () => {
    if (!deptId || !courseId) throw new Error("Missing dept/course");
    const res = await api.post("/create-exams/cie/plan", {
      examType: "IA1",
      semester: 3,
      startDate: "2026-07-15",
      endDate: "2026-07-16",
      shifts: [{ startTime: "09:00", endTime: "12:00" }],
      routine: [
        {
          date: "2026-07-15",
          shiftIndex: 0,
          assignments: { [deptId]: courseId },
        },
      ],
    });
    assertStatus(res, 201);
    assertExists(res.data.data.examGroup, "examGroup");
  });

  // --- Cleanup ---
  await test("Cleanup: delete test department", async () => {
    if (courseId) await api.delete(`/departments/courses/${courseId}`).catch(() => {});
    if (semId) await api.delete(`/departments/semesters/${semId}`).catch(() => {});
    if (deptId) await api.delete(`/departments/${deptId}`).catch(() => {});
  });

  const result = summary("CREATE EXAMS (CIE)");
  return result;
}

module.exports = run;
if (require.main === module) run();
