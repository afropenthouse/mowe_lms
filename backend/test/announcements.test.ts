import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { db } = await import("../src/db.js");
const { app } = await import("../src/app.js");
const {
  announcementSchema,
  audienceSchema,
  announcementRecipients,
  sendAnnouncement,
  learnerNotifications,
} = await import("../src/learning/announcements.js");
const { token, digest } = await import("../src/auth/crypto.js");
const { SESSION_COOKIE, config } = await import("../src/config.js");
test("announcement validation requires a valid audience and plain text message", () => {
  assert.equal(
    audienceSchema.safeParse({ audience: "selected" }).success,
    false,
  );
  assert.equal(audienceSchema.safeParse({ audience: "groups" }).success, false);
  assert.equal(
    announcementSchema.safeParse({
      title: " ",
      body: "Message",
      targeting: { audience: "all" },
    }).success,
    false,
  );
  assert.equal(
    announcementSchema.safeParse({
      title: "Title",
      body: "Message",
      targeting: { audience: "all" },
    }).success,
    true,
  );
});
test(
  "announcements deliver only to selected active learners, preserve privacy and persist read state",
  { timeout: 180000 },
  async () => {
    const ids: string[] = [],
      messages: string[] = [];
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = "http://127.0.0.1:" + address.port;
    async function learner(verified = true, suspended = false) {
      const u = await db.user.create({
        data: {
          name: "Announcement Test",
          email: `announcement-${randomUUID()}@example.test`,
          passwordHash: "unused-test-hash",
          emailVerifiedAt: verified ? new Date() : null,
          suspendedAt: suspended ? new Date() : null,
        },
      });
      ids.push(u.id);
      return u;
    }
    try {
      const [one, two, outside, pending, suspended] = await Promise.all([
        learner(),
        learner(),
        learner(),
        learner(false),
        learner(true, true),
      ]);
      const target = audienceSchema.parse({
        audience: "selected",
        learnerIds: [one.id, two.id, pending.id, suspended.id],
      });
      assert.deepEqual(
        (await announcementRecipients(target)).map((u) => u.id).sort(),
        [one.id, two.id].sort(),
      );
      await assert.rejects(
        () =>
          sendAnnouncement(
            announcementSchema.parse({
              title: "Invalid selection",
              body: "Must not send",
              targeting: target,
            }),
            { id: "qa-test", name: "QA Academy" },
          ),
        /unavailable/,
      );
      assert.equal((await learnerNotifications(one.id)).total, 0);
      await db.learningRecord.create({
        data: { userId: one.id, kind: "enroll", key: "program", document: {} },
      });
      const groupRecipients = await announcementRecipients(
        audienceSchema.parse({ audience: "groups", groups: ["enrolled"] }),
      );
      assert.ok(groupRecipients.some((u) => u.id === one.id));
      assert.ok(!groupRecipients.some((u) => u.id === two.id));
      const sent = await sendAnnouncement(
        announcementSchema.parse({
          title: "Test-only update",
          body: "A private message for temporary test learners.",
          targeting: { audience: "selected", learnerIds: [one.id, two.id] },
        }),
        { id: "qa-test", name: "QA Academy" },
      );
      messages.push(sent.id);
      assert.equal(sent.recipientCount, 2);
      assert.equal((await learnerNotifications(one.id)).unread, 1);
      assert.equal((await learnerNotifications(two.id)).unread, 1);
      assert.equal((await learnerNotifications(outside.id)).total, 0);
      const raw = token();
      await db.session.create({
        data: {
          userId: one.id,
          tokenHash: digest(raw),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      const cookies = new Map([[SESSION_COOKIE, raw]]);
      let csrf = "";
      async function request(
        path: string,
        body?: unknown,
        method = body === undefined ? "GET" : "PATCH",
      ) {
        if (body !== undefined && !csrf)
          csrf = (await request("/auth/csrf")).data.csrfToken;
        const res = await fetch(base + path, {
          method,
          headers: {
            Origin: config.FRONTEND_URL,
            Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
            ...(body === undefined
              ? {}
              : { "Content-Type": "application/json", "X-CSRF-Token": csrf }),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        for (const cookie of res.headers.getSetCookie()) {
          const pair = cookie.split(";")[0],
            at = pair.indexOf("=");
          cookies.set(pair.slice(0, at), pair.slice(at + 1));
        }
        return { status: res.status, data: await res.json() };
      }
      assert.equal((await request("/admin/announcements")).status, 403);
      assert.equal(
        (
          await request(
            "/admin/announcements",
            {
              title: "Blocked",
              body: "Blocked",
              targeting: { audience: "all" },
            },
            "POST",
          )
        ).status,
        403,
      );
      const inbox = await request("/learning/notifications");
      assert.equal(inbox.status, 200);
      assert.equal(inbox.data.notifications[0].title, "Test-only update");
      assert.equal(inbox.data.notifications[0].senderId, undefined);
      assert.equal(
        (await request("/learning/notifications/read", { id: randomUUID() }))
          .status,
        404,
      );
      assert.equal(
        (
          await request("/learning/notifications/read", {
            id: sent.id,
            userId: two.id,
          })
        ).status,
        400,
      );
      assert.equal(
        (await request("/learning/notifications/read", { id: sent.id })).status,
        200,
      );
      assert.equal((await learnerNotifications(one.id)).unread, 0);
      assert.equal((await learnerNotifications(two.id)).unread, 1);
      assert.equal(
        (await request("/learning/notifications/read", { id: sent.id })).status,
        200,
        "Read operation is idempotent",
      );
      assert.equal(
        (await request("/learning/notifications/read", {})).status,
        200,
      );
      assert.equal(
        (await request("/learning/notifications?page=0")).status,
        400,
      );
      const anonymous = await fetch(base + "/learning/notifications");
      assert.equal(anonymous.status, 401);
    } finally {
      await db.academySetting.deleteMany({
        where: {
          id: {
            in: [
              ...messages.map((id) => "announcement:" + id),
              ...ids.map((id) => "learning:user:" + id),
            ],
          },
        },
      });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
