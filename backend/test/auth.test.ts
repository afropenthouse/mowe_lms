import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { testOutbox, closeMail } = await import("../src/mail.js");
const { config } = await import("../src/config.js");
const { inviteAdmin } = await import("../src/auth/service.js");
const fixtureEmails: string[] = [];
const uniqueEmail = () => {
  const e = `auth-test-${randomUUID()}@example.test`;
  fixtureEmails.push(e);
  return e;
};
const password = "Test!234";
function mailCode(email: string) {
  const text = testOutbox.filter((m) => m.to === email).at(-1)?.text || "";
  const code = text.match(/\b\d{6}\b/)?.[0];
  assert.ok(code, "A verification email was produced");
  return code;
}
test("authentication lifecycle, account recovery and access boundaries", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  function client() {
    const cookies = new Map<string, string>();
    let csrf = "";
    return {
      async request(
        path: string,
        body?: unknown,
        method = body === undefined ? "GET" : "POST",
      ): Promise<{ status: number; data: any; response: Response }> {
        if (body !== undefined && !csrf) {
          const r = await this.request("/csrf");
          csrf = r.data.csrfToken;
        }
        const response = await fetch(base + "/auth" + path, {
          method,
          headers: {
            Origin: config.FRONTEND_URL,
            Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
            ...(body !== undefined
              ? { "Content-Type": "application/json", "x-csrf-token": csrf }
              : {}),
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        for (const raw of response.headers.getSetCookie()) {
          const [pair] = raw.split(";"),
            at = pair.indexOf("=");
          cookies.set(pair.slice(0, at), pair.slice(at + 1));
        }
        return {
          status: response.status,
          data: await response.json(),
          response,
        };
      },
    };
  }
  const learner = client(),
    otherDevice = client();
  const email = uniqueEmail();
  let challengeId = "";
  try {
    await t.test("CSRF and cross-origin writes are rejected", async () => {
      const r = await fetch(base + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: "Test Learner", password }),
      });
      assert.equal(r.status, 403);
      const cross = await fetch(base + "/auth/csrf", {
        headers: { Origin: "https://untrusted.example" },
      });
      assert.equal(cross.status, 403);
    });
    await t.test(
      "new passwords must be between eight and twelve characters",
      async () => {
        for (const candidate of ["Short!1", "TooLong!123456"]) {
          const result = await client().request("/register", {
            email: uniqueEmail(),
            name: "Validation Test",
            password: candidate,
          });
          assert.equal(result.status, 400);
        }
      },
    );
    await t.test(
      "signup normalizes email and stores a password hash",
      async () => {
        const r = await learner.request("/register", {
          email: email.toUpperCase(),
          name: "Test Learner",
          password,
          role: "student",
        });
        assert.equal(r.status, 201);
        challengeId = r.data.challengeId;
        const user = await db.user.findUniqueOrThrow({ where: { email } });
        assert.ok(user.passwordHash.startsWith("scrypt$"));
        assert.notEqual(user.passwordHash, password);
        assert.equal(user.emailVerifiedAt, null);
        const attempt = await learner.request("/login", { email, password });
        assert.equal(attempt.status, 403);
        assert.equal(attempt.data.code, "EMAIL_UNVERIFIED");
      },
    );
    await t.test(
      "wrong attempts persist, verification creates a secure session, and codes cannot replay",
      async () => {
        let r = await learner.request("/verify-email", {
          challengeId,
          code: "000000",
        });
        assert.equal(r.status, 400);
        assert.equal(
          (
            await db.authChallenge.findUniqueOrThrow({
              where: { id: challengeId },
            })
          ).attempts,
          1,
        );
        r = await learner.request("/verify-email", {
          challengeId,
          code: mailCode(email),
        });
        assert.equal(r.status, 200);
        assert.equal(r.data.user.role, "student");
        assert.ok(
          r.response.headers
            .getSetCookie()
            .some((s) => s.includes("HttpOnly") && s.includes("SameSite=Lax")),
        );
        assert.equal((await learner.request("/me")).data.user.email, email);
        assert.equal(
          (
            await learner.request("/verify-email", {
              challengeId,
              code: mailCode(email),
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      "learner cannot invite administrators or assign privileged roles",
      async () => {
        assert.equal((await learner.request("/admin/users")).status, 403);
        assert.equal(
          (
            await learner.request("/admin-invitations", {
              email: uniqueEmail(),
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await client().request("/register", {
              email: uniqueEmail(),
              name: "Unauthorized Admin",
              password,
              role: "admin",
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await client().request("/register", {
              email: uniqueEmail(),
              name: "Unauthorized Owner",
              password,
              role: "SUPERADMIN",
            })
          ).status,
          400,
        );
      },
    );
    await t.test("profile updates persist and cannot change role", async () => {
      const r = await learner.request(
        "/profile",
        {
          name: "Updated Learner",
          bio: "Business learner",
          linkedin: "",
          photo: "",
        },
        "PATCH",
      );
      assert.equal(r.status, 200);
      assert.equal(
        (await learner.request("/me")).data.user.name,
        "Updated Learner",
      );
      assert.equal(
        (
          await learner.request(
            "/profile",
            { name: "Updated Learner", role: "ADMIN" },
            "PATCH",
          )
        ).status,
        400,
      );
    });
    await t.test(
      "reset codes expire and a password reset revokes every existing session",
      async () => {
        assert.equal(
          (
            await otherDevice.request("/login", {
              email,
              password,
              remember: true,
            })
          ).status,
          200,
        );
        const r = await learner.request("/forgot-password", { email });
        assert.equal(r.status, 200);
        const reset = r.data.challengeId;
        await db.authChallenge.update({
          where: { id: reset },
          data: { expiresAt: new Date(Date.now() - 1000) },
        });
        assert.equal(
          (
            await learner.request("/reset-password", {
              challengeId: reset,
              code: mailCode(email),
              password: "Next!234",
            })
          ).status,
          400,
        );
        await db.authChallenge.update({
          where: { id: reset },
          data: { expiresAt: new Date(Date.now() + 600000) },
        });
        assert.equal(
          (
            await learner.request("/reset-password", {
              challengeId: reset,
              code: mailCode(email),
              password: "Next!234",
            })
          ).status,
          200,
        );
        assert.equal((await otherDevice.request("/me")).data.user, null);
        assert.equal(
          (await client().request("/login", { email, password })).status,
          401,
        );
        assert.equal(
          (
            await learner.request("/login", {
              email,
              password: "Next!234",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await learner.request("/reset-password", {
              challengeId: reset,
              code: mailCode(email),
              password,
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      "unknown password-reset emails get the same generic response",
      async () => {
        const before = testOutbox.length;
        const r = await client().request("/forgot-password", {
          email: uniqueEmail(),
        });
        assert.equal(r.status, 200);
        assert.equal(testOutbox.length, before);
        assert.ok(r.data.challengeId);
        assert.match(r.data.message, /If this email is eligible/);
      },
    );
    await t.test(
      "resend cooldown, code replacement and attempt limits are enforced",
      async () => {
        const second = uniqueEmail(),
          c = client();
        let r = await c.request("/register", {
          email: second,
          name: "Second Learner",
          password,
        });
        const id = r.data.challengeId,
          oldCode = mailCode(second);
        assert.equal(
          (await c.request("/resend-code", { challengeId: id })).status,
          429,
        );
        await db.authChallenge.update({
          where: { id },
          data: { sentAt: new Date(Date.now() - 61000) },
        });
        r = await c.request("/resend-code", { challengeId: id });
        assert.equal(r.status, 200);
        const fresh = mailCode(second);
        if (oldCode !== fresh)
          assert.equal(
            (
              await c.request("/verify-email", {
                challengeId: id,
                code: oldCode,
              })
            ).status,
            400,
          );
        for (let i = 0; i < 5; i++)
          assert.ok(
            [400, 429].includes(
              (
                await c.request("/verify-email", {
                  challengeId: id,
                  code: "000000",
                })
              ).status,
            ),
          );
        assert.ok(
          [400, 429].includes(
            (await c.request("/verify-email", { challengeId: id, code: fresh }))
              .status,
          ),
        );
      },
    );
    await t.test(
      "valid administrator invitations are email-bound and verified before granting access",
      async () => {
        const adminEmail = uniqueEmail();
        await inviteAdmin(adminEmail);
        const invite = testOutbox
          .filter((m) => m.to === adminEmail)
          .at(-1)!
          .text.match(/invite=([a-f0-9]{64})/)![1];
        assert.equal(
          (
            await client().request("/register", {
              email: uniqueEmail(),
              name: "Wrong Recipient",
              password,
              role: "admin",
              inviteToken: invite,
            })
          ).status,
          403,
        );
        const admin = client();
        const r = await admin.request("/register", {
          email: adminEmail,
          name: "Test Administrator",
          password,
          role: "admin",
          inviteToken: invite,
        });
        assert.equal(r.status, 201);
        const verified = await admin.request("/verify-email", {
          challengeId: r.data.challengeId,
          code: mailCode(adminEmail),
        });
        assert.equal(verified.status, 200);
        assert.equal(verified.data.user.role, "admin");
        assert.equal((await admin.request("/admin/users")).status, 403);
        const invitee = uniqueEmail();
        assert.equal(
          (await admin.request("/admin-invitations", { email: invitee }))
            .status,
          403,
        );
        await db.user.update({
          where: { email: adminEmail },
          data: { role: "SUPERADMIN" },
        });
        assert.equal((await admin.request("/me")).data.user.isSuperAdmin, true);
        const directory = await admin.request("/admin/users");
        assert.equal(directory.status, 200);
        assert.ok(
          directory.data.users.some((u: any) => u.email === adminEmail),
        );
        assert.ok(!("passwordHash" in directory.data.users[0]));
        assert.equal(
          (await admin.request("/admin-invitations", { email: invitee }))
            .status,
          201,
        );
        assert.equal(
          (
            await client().request("/register", {
              email: uniqueEmail(),
              name: "Replay Invitation",
              password,
              role: "admin",
              inviteToken: invite,
            })
          ).status,
          403,
        );
        await admin.request("/logout", {});
        assert.equal((await admin.request("/me")).data.user, null);
      },
    );
    await t.test(
      "only one concurrent verification can consume the same code",
      async () => {
        const email = uniqueEmail(),
          a = client(),
          b = client();
        const r = await a.request("/register", {
          email,
          name: "Concurrent Learner",
          password,
        });
        const body = { challengeId: r.data.challengeId, code: mailCode(email) };
        const results = await Promise.all([
          a.request("/verify-email", body),
          b.request("/verify-email", body),
        ]);
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
        const user = await db.user.findUniqueOrThrow({ where: { email } });
        assert.equal(await db.session.count({ where: { userId: user.id } }), 1);
      },
    );
    await t.test("logout-all invalidates all sessions", async () => {
      assert.equal(
        (
          await otherDevice.request("/login", {
            email,
            password: "Next!234",
          })
        ).status,
        200,
      );
      assert.equal((await learner.request("/logout-all", {})).status, 200);
      assert.equal((await otherDevice.request("/me")).data.user, null);
    });
  } finally {
    const fixtureUsers = await db.user.findMany({
      where: { email: { in: fixtureEmails } },
      select: { id: true },
    });
    await db.academySetting.deleteMany({
      where: { id: { in: fixtureUsers.map((u) => "learning:user:" + u.id) } },
    });
    await db.user.deleteMany({ where: { email: { in: fixtureEmails } } });
    await db.adminInvitation.deleteMany({
      where: { email: { in: fixtureEmails } },
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    closeMail();
    await db.$disconnect();
  }
});
