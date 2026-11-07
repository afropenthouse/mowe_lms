import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { once } from "node:events";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { SESSION_COOKIE, config } = await import("../src/config.js");

test("admin announcement history needs a session but no CSRF token; sending remains CSRF protected", async () => {
  // Mock persistence only: no real administrator account or messages are created.
  let role = "ADMIN";
  const originalSession = db.session.findUnique;
  const originalQuery = db.$queryRaw;
  const originalCount = db.academySetting.count;
  db.session.findUnique = mock.fn(async () => ({
    userId: "history-test",
    expiresAt: new Date(Date.now() + 60000),
    user: { role, emailVerifiedAt: new Date(), suspendedAt: null },
  })) as typeof db.session.findUnique;
  const history = mock.fn(async () => []);
  db.$queryRaw = history as typeof db.$queryRaw;
  db.academySetting.count = mock.fn(
    async () => 0,
  ) as typeof db.academySetting.count;
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = "http://127.0.0.1:" + address.port;
  const headers = {
    Cookie: `${SESSION_COOKIE}=${"a".repeat(64)}`,
    Origin: config.FRONTEND_URL,
  };
  try {
    const response = await fetch(base + "/admin/announcements", { headers });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      messages: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    assert.equal(history.mock.callCount(), 1);
    for (const path of [
      "/admin/announcements",
      "/admin/announcements/preview",
    ]) {
      const blocked = await fetch(base + path, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(blocked.status, 403);
      assert.equal((await blocked.json()).code, "CSRF_INVALID");
    }
    assert.equal((await fetch(base + "/admin/announcements")).status, 401);
    role = "STUDENT";
    assert.equal(
      (await fetch(base + "/admin/announcements", { headers })).status,
      403,
    );
    assert.equal(
      history.mock.callCount(),
      1,
      "Unauthorized requests cannot read the history",
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.session.findUnique = originalSession;
    db.$queryRaw = originalQuery;
    db.academySetting.count = originalCount;
  }
});
