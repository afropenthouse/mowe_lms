import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { config, SESSION_COOKIE } = await import("../src/config.js");
const { token, digest, hashPassword, verifyPassword, protectedDigest } =
  await import("../src/auth/crypto.js");
const { requestReset } = await import("../src/auth/service.js");
const { testOutbox } = await import("../src/mail.js");
async function fixture() {
  const ids: string[] = [],
    server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = "http://127.0.0.1:" + address.port;
  function client(raw?: string) {
    const cookies = new Map<string, string>();
    if (raw) cookies.set(SESSION_COOKIE, raw);
    let csrf = "";
    return {
      cookies,
      async request(
        path: string,
        body?: unknown,
        method = body === undefined ? "GET" : "POST",
      ) {
        if (body !== undefined && !csrf) {
          const r = await this.request("/auth/csrf");
          csrf = r.data.csrfToken;
        }
        const multipart = body instanceof FormData;
        const response = await fetch(base + path, {
          method,
          redirect: "manual",
          headers: {
            Origin: config.FRONTEND_URL,
            Cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
            ...(body === undefined
              ? {}
              : {
                  "X-CSRF-Token": csrf,
                  ...(multipart ? {} : { "Content-Type": "application/json" }),
                }),
          },
          ...(body === undefined
            ? {}
            : { body: multipart ? body : JSON.stringify(body) }),
        });
        for (const raw of response.headers.getSetCookie()) {
          const p = raw.split(";")[0],
            at = p.indexOf("=");
          cookies.set(p.slice(0, at), p.slice(at + 1));
        }
        return { status: response.status, data: await response.json() };
      },
    };
  }
  const password = "Before123!",
    passwordHash = await hashPassword(password);
  async function user(role: "STUDENT" | "ADMIN") {
    const u = await db.user.create({
      data: {
        email: "profile-test-" + randomUUID() + "@example.test",
        name: "Profile Test",
        role,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    ids.push(u.id);
    const raw = token();
    await db.session.create({
      data: {
        userId: u.id,
        tokenHash: digest(raw),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    return { user: u, client: client(raw), raw };
  }
  return {
    ids,
    user,
    client,
    password,
    base,
    async close() {
      await db.academySetting.deleteMany({
        where: { id: { in: ids.map((id) => "learning:user:" + id) } },
      });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
test(
  "profile lifecycle for learners and admins, immutable email and student numbers",
  { timeout: 180000 },
  async (t) => {
    const f = await fixture();
    try {
      const [a, b] = await Promise.all([f.user("STUDENT"), f.user("STUDENT")]);
      assert.match(a.user.studentNumber!, /^MOWE\d+$/);
      assert.notEqual(a.user.studentNumber, b.user.studentNumber);
      for (const account of [a, await f.user("ADMIN")])
        await t.test(account.user.role + " profile and password", async () => {
          const c = account.client,
            profile = {
              name: "Updated Profile",
              bio: "Practical business learner",
              linkedin: "https://www.linkedin.com/in/example",
              photo: "",
            };
          assert.equal(
            (await c.request("/auth/profile", profile, "PATCH")).status,
            200,
          );
          const me = (await c.request("/auth/me")).data.user;
          assert.equal(me.name, profile.name);
          assert.equal(me.profile.bio, profile.bio);
          assert.equal(me.studentNumber, account.user.studentNumber);
          if (account.user.role === "ADMIN")
            assert.equal(me.studentNumber, null);
          for (const extra of [
            { email: "changed@example.test" },
            { role: "admin" },
            { studentNumber: "MOWE999" },
          ])
            assert.equal(
              (
                await c.request(
                  "/auth/profile",
                  { ...profile, ...extra },
                  "PATCH",
                )
              ).status,
              400,
            );
          assert.equal(
            (await c.request("/auth/me")).data.user.email,
            account.user.email,
          );
          const payload = {
            currentPassword: f.password,
            newPassword: "After1234!",
            confirmPassword: "After1234!",
          };
          assert.equal(
            (await f.client().request("/auth/change-password", payload)).status,
            401,
          );
          assert.equal(
            (
              await c.request("/auth/change-password", {
                ...payload,
                currentPassword: "Wrong123!",
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await c.request("/auth/change-password", {
                ...payload,
                confirmPassword: "Mismatch!",
              })
            ).status,
            400,
          );
          for (const value of ["short", "MuchTooLong123456"])
            assert.equal(
              (
                await c.request("/auth/change-password", {
                  ...payload,
                  newPassword: value,
                  confirmPassword: value,
                })
              ).status,
              400,
            );
          assert.equal(
            (
              await c.request("/auth/change-password", {
                currentPassword: f.password,
                newPassword: f.password,
                confirmPassword: f.password,
              })
            ).status,
            400,
          );
          const second = f.client();
          assert.equal(
            (
              await second.request("/auth/login", {
                email: account.user.email,
                password: f.password,
              })
            ).status,
            200,
          );
          const reset = await requestReset(account.user.email),
            code = testOutbox
              .filter((m) => m.to === account.user.email)
              .at(-1)!
              .text.match(/\b\d{6}\b/)![0];
          const oldCookie = account.raw;
          const changed = await c.request("/auth/change-password", payload);
          assert.equal(changed.status, 200, JSON.stringify(changed.data));
          assert.notEqual(c.cookies.get(SESSION_COOKIE), oldCookie);
          assert.equal(
            (await c.request("/auth/me")).data.user.id,
            account.user.id,
          );
          assert.equal((await second.request("/auth/me")).data.user, null);
          assert.equal(
            (await f.client(oldCookie).request("/auth/me")).data.user,
            null,
          );
          assert.equal(
            (
              await f.client().request("/auth/login", {
                email: account.user.email,
                password: f.password,
              })
            ).status,
            401,
          );
          assert.equal(
            (
              await f.client().request("/auth/login", {
                email: account.user.email,
                password: payload.newPassword,
              })
            ).status,
            200,
          );
          assert.equal(
            (
              await f.client().request("/auth/reset-password", {
                challengeId: reset.challengeId,
                code,
                password: "Reset123!",
              })
            ).status,
            400,
          );
          const stored = await db.user.findUniqueOrThrow({
            where: { id: account.user.id },
          });
          assert.ok(
            await verifyPassword(payload.newPassword, stored.passwordHash),
          );
          assert.ok(stored.passwordChangedAt);
          assert.equal(stored.email, account.user.email);
          assert.equal(stored.studentNumber, account.user.studentNumber);
        });
    } finally {
      await f.close();
      await db.$disconnect();
    }
  },
);

test(
  "learner and admin portals reject accounts from the other role",
  { timeout: 120000 },
  async () => {
    const f = await fixture();
    try {
      const student = await f.user("STUDENT"),
        admin = await f.user("ADMIN"),
        owner = await f.user("ADMIN");
      await db.user.update({
        where: { id: owner.user.id },
        data: { role: "SUPERADMIN" },
      });
      for (const account of [student, admin, owner]) {
        const portal = account.user.role === "STUDENT" ? "learner" : "admin";
        const before = await db.session.count({
          where: { userId: account.user.id },
        });
        const wrong = await f
          .client()
          .request("/auth/login", {
            email: account.user.email,
            password: f.password,
            portal: portal === "admin" ? "learner" : "admin",
          });
        assert.equal(wrong.status, 403);
        assert.equal(wrong.data.code, "WRONG_PORTAL");
        assert.equal(
          await db.session.count({ where: { userId: account.user.id } }),
          before,
        );
        const correct = await f
          .client()
          .request("/auth/login", {
            email: account.user.email,
            password: f.password,
            portal,
          });
        assert.equal(correct.status, 200);
        assert.equal(
          correct.data.user.role,
          portal === "admin" ? "admin" : "student",
        );
        assert.equal(
          correct.data.user.isSuperAdmin,
          account.user.id === owner.user.id,
        );
      }
      for (const account of [student, admin]) {
        await db.user.update({
          where: { id: account.user.id },
          data: { emailVerifiedAt: null },
        });
        const challengeId = randomUUID(),
          code = "123456",
          portal = account.user.role === "STUDENT" ? "learner" : "admin";
        await db.authChallenge.create({
          data: {
            id: challengeId,
            userId: account.user.id,
            purpose: "VERIFY_EMAIL",
            codeHash: protectedDigest(challengeId + ":" + code),
            expiresAt: new Date(Date.now() + 600000),
          },
        });
        const before = await db.session.count({
          where: { userId: account.user.id },
        });
        const wrong = await f
          .client()
          .request("/auth/verify-email", {
            challengeId,
            code,
            portal: portal === "admin" ? "learner" : "admin",
          });
        assert.equal(wrong.status, 403);
        assert.equal(wrong.data.code, "WRONG_PORTAL");
        assert.equal(
          (
            await db.authChallenge.findUniqueOrThrow({
              where: { id: challengeId },
            })
          ).consumedAt,
          null,
        );
        assert.equal(
          await db.session.count({ where: { userId: account.user.id } }),
          before,
        );
        const correct = await f
          .client()
          .request("/auth/verify-email", { challengeId, code, portal });
        assert.equal(correct.status, 200);
        assert.equal(
          correct.data.user.role,
          portal === "admin" ? "admin" : "student",
        );
      }
    } finally {
      await f.close();
      await db.$disconnect();
    }
  },
);

test(
  "Cloudinary profile photo uploads and persists for both roles",
  { skip: process.env.RUN_CLOUDINARY_TESTS !== "1", timeout: 120000 },
  async () => {
    const f = await fixture(),
      assets: string[] = [];
    const { destroyFile } = await import("../src/files/storage.js");
    try {
      for (const role of ["STUDENT", "ADMIN"] as const) {
        const account = await f.user(role),
          body = new FormData();
        body.set("purpose", "photo");
        body.set(
          "file",
          new Blob(
            [
              Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
                "base64",
              ),
            ],
            { type: "image/png" },
          ),
          "profile.png",
        );
        const uploaded = await account.client.request("/files", body);
        assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
        assets.push(uploaded.data.id);
        const url = uploaded.data.url;
        assert.ok(url.startsWith("https://res.cloudinary.com/"));
        assert.equal((await fetch(url)).status, 200);
        assert.equal(
          (
            await account.client.request(
              "/auth/profile",
              { name: "Photo Test", photo: url },
              "PATCH",
            )
          ).status,
          200,
        );
        assert.equal(
          (await account.client.request("/auth/me")).data.user.profile.photo,
          url,
        );
        assert.equal(
          (
            await account.client.request(
              "/files/" + uploaded.data.id,
              {},
              "DELETE",
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await account.client.request(
              "/auth/profile",
              { name: "Photo Test", photo: "" },
              "PATCH",
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await account.client.request(
              "/files/" + uploaded.data.id,
              {},
              "DELETE",
            )
          ).status,
          200,
        );
      }
    } finally {
      for (const a of await db.fileAsset.findMany({
        where: { id: { in: assets } },
      })) {
        await destroyFile(a);
        await db.fileAsset.delete({ where: { id: a.id } });
      }
      await f.close();
      await db.$disconnect();
    }
  },
);
