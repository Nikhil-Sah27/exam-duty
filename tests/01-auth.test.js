const {
  api, setToken, clearToken, test, skip,
  assert, assertEqual, assertExists, assertStatus, summary, CONFIG,
} = require("./helpers");

async function run() {
  console.log("\n🔐 AUTH TESTS\n");

  let token = null;
  let userId = null;

  // --- Bootstrap ---
  await test("POST /users/bootstrap - create initial admin", async () => {
    try {
      const res = await api.post("/users/bootstrap");
      assertExists(res.data.data, "response data");
    } catch (err) {
      // 409 means already bootstrapped - that's fine
      if (err.response && err.response.status === 409) {
        console.log("     (admin already exists, continuing)");
      } else {
        throw err;
      }
    }
  });

  // --- Register ---
  const testEmail = `testuser_${Date.now()}@test.com`;
  let registered = false;

  await test("POST /auth/register - register new user", async () => {
    const res = await api.post("/auth/register", {
      name: "Test User",
      email: testEmail,
      password: "test123456",
      phone: "9876543210",
      // Roles are derived from designation; only "Other" lets the caller pick.
      designation: "Other",
      roles: ["invigilator"],
    });
    assertStatus(res, 201);
    assertExists(res.data.data.token, "token");
    assertExists(res.data.data.user, "user");
    assertEqual(res.data.data.user.email, testEmail, "email");
    registered = true;
  });

  await test("POST /auth/register - duplicate email should fail", async () => {
    // Without a real first registration this case proves nothing, so make the
    // dependency an assertion rather than letting it silently pass on a 4xx.
    assert(registered, "the preceding register must have succeeded");
    let res = null;
    try {
      res = await api.post("/auth/register", {
        name: "Duplicate",
        email: testEmail,
        password: "test123456",
        phone: "9876543210",
        designation: "Other",
        roles: ["invigilator"],
      });
    } catch (err) {
      assertExists(err.response, "error response");
      assertStatus(err.response, 409);
      assert(
        /already registered/i.test(err.response.data.message),
        `Expected duplicate-email message, got "${err.response.data.message}"`
      );
      return;
    }
    throw new Error(`Duplicate email was accepted with status ${res.status}`);
  });

  await test("POST /auth/register - missing fields should fail", async () => {
    try {
      await api.post("/auth/register", { name: "No Email" });
      throw new Error("Should have failed");
    } catch (err) {
      assert(err.response && err.response.status >= 400, "Should return 4xx");
    }
  });

  // --- Login ---
  await test("POST /auth/login - valid credentials", async () => {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    assertStatus(res, 200);
    assertExists(res.data.data.token, "token");
    token = res.data.data.token;
    userId = res.data.data.user.id || res.data.data.user._id;
    setToken(token);
  });

  await test("POST /auth/login - wrong password should fail", async () => {
    try {
      await api.post("/auth/login", {
        email: CONFIG.ADMIN_EMAIL,
        password: "wrongpassword",
      });
      throw new Error("Should have failed");
    } catch (err) {
      assert(err.response && err.response.status === 401, "Should return 401");
    }
  });

  await test("POST /auth/login - non-existent email should fail", async () => {
    try {
      await api.post("/auth/login", {
        email: "nonexistent@test.com",
        password: "test123",
      });
      throw new Error("Should have failed");
    } catch (err) {
      assert(err.response && err.response.status >= 400, "Should return 4xx");
    }
  });

  // --- Get Me ---
  await test("GET /auth/me - authenticated", async () => {
    const res = await api.get("/auth/me");
    assertStatus(res, 200);
    assertExists(res.data.data.email, "email");
  });

  await test("GET /auth/me - no token should fail", async () => {
    clearToken();
    try {
      await api.get("/auth/me");
      throw new Error("Should have failed");
    } catch (err) {
      assert(err.response && err.response.status === 401, "Should return 401");
    }
    setToken(token);
  });

  await test("GET /auth/me - invalid token should fail", async () => {
    const originalToken = api.defaults.headers.common["Authorization"];
    api.defaults.headers.common["Authorization"] = "Bearer invalidtoken123";
    try {
      await api.get("/auth/me");
      throw new Error("Should have failed");
    } catch (err) {
      assert(err.response && err.response.status === 401, "Should return 401");
    }
    api.defaults.headers.common["Authorization"] = originalToken;
  });

  const result = summary("AUTH");

  // Export for runner
  module.exports.token = token;
  module.exports.userId = userId;

  return result;
}

module.exports = run;
module.exports.token = null;
module.exports.userId = null;

if (require.main === module) run();
