const {
  api, setToken, test,
  assert, assertExists, assertStatus, summary, resetCounters, CONFIG,
} = require("./helpers");

async function run(token) {
  console.log("\n🔔 NOTIFICATION TESTS\n");
  resetCounters();

  if (!token) {
    const res = await api.post("/auth/login", {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
    });
    token = res.data.data.token;
  }
  setToken(token);

  let notificationId = null;

  // --- List Notifications ---
  await test("GET /notifications - list notifications", async () => {
    const res = await api.get("/notifications");
    assertStatus(res, 200);
    assert(Array.isArray(res.data.data), "data should be array");
    if (res.data.data.length > 0) {
      notificationId = res.data.data[0]._id || res.data.data[0].id;
    }
  });

  // --- Unread Count ---
  await test("GET /notifications/unread-count - get unread count", async () => {
    const res = await api.get("/notifications/unread-count");
    assertStatus(res, 200);
    assertExists(res.data.data, "unread count data");
  });

  // --- Mark Single as Read ---
  if (notificationId) {
    await test("PATCH /notifications/:id/read - mark as read", async () => {
      const res = await api.patch(`/notifications/${notificationId}/read`);
      assertStatus(res, 200);
    });
  } else {
    skip("PATCH /notifications/:id/read", "no notifications exist");
  }

  // --- Mark All as Read ---
  await test("PATCH /notifications/read-all - mark all as read", async () => {
    const res = await api.patch("/notifications/read-all");
    assertStatus(res, 200);
  });

  const result = summary("NOTIFICATIONS");
  return result;
}

module.exports = run;
if (require.main === module) run();
