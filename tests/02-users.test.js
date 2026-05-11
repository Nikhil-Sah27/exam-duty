const {
  api, setToken, test, skip,
  assert, assertEqual, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n👤 USER TESTS\n");
  resetCounters();

  // Login if no token passed
  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  let createdUserId = null;
  const userEmail = `user_test_${Date.now()}@test.com`;

  // --- Create User ---
  await test("POST /users - create new user", async () => {
    const res = await api.post("/users", {
      name: "Test Teacher",
      email: userEmail,
      password: "teacher123",
      role: "invigilator",
      phone: "9876543210",
      department: "CSE",
      designation: "Assistant Professor",
    });
    assertStatus(res, 201);
    assertExists(res.data.data, "user data");
    createdUserId = res.data.data._id || res.data.data.id;
  });

  await test("POST /users - duplicate email should fail", async () => {
    try {
      await api.post("/users", {
        name: "Duplicate",
        email: userEmail,
        password: "test123",
        role: "invigilator",
      });
      throw new Error("Should have thrown");
    } catch (err) {
      assert(err.response && err.response.status >= 400, "Should return 4xx");
    }
  });

  // --- List Users ---
  await test("GET /users - list all users", async () => {
    const res = await api.get("/users");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
    assert(res.data.data.length > 0, "should have at least 1 user");
  });

  await test("GET /users?role=invigilator - filter by role", async () => {
    const res = await api.get("/users?role=invigilator");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
  });

  // --- Get User by ID ---
  await test("GET /users/:id - get created user", async () => {
    if (!createdUserId) throw new Error("No user created");
    const res = await api.get(`/users/${createdUserId}`);
    assertStatus(res, 200);
    assertEqual(res.data.data.email, userEmail, "email");
  });

  await test("GET /users/:id - invalid ID should fail", async () => {
    try {
      await api.get("/users/invalidid123");
      throw new Error("Should have failed");
    } catch (err) {
      assert(err.response && err.response.status >= 400, "Should return 4xx");
    }
  });

  // --- Update User ---
  await test("PUT /users/:id - update user", async () => {
    if (!createdUserId) throw new Error("No user created");
    const res = await api.put(`/users/${createdUserId}`, {
      name: "Updated Teacher",
      phone: "1111111111",
      designation: "Professor",
    });
    assertStatus(res, 200);
    assertEqual(res.data.data.name, "Updated Teacher", "name");
  });

  // --- Delete (Deactivate) User ---
  await test("DELETE /users/:id - deactivate user", async () => {
    if (!createdUserId) throw new Error("No user created");
    const res = await api.delete(`/users/${createdUserId}`);
    assertStatus(res, 200);
  });

  const result = summary("USERS");
  module.exports.createdUserId = createdUserId;
  return result;
}

module.exports = run;
module.exports.createdUserId = null;

if (require.main === module) run();
