import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
process.env.REQUIRE_EMAIL_VERIFICATION = "false";
const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { config } = await import("../src/config.js");
const { testOutbox, closeMail } = await import("../src/mail.js");

test("signup without OTP creates a usable session without email or account takeover", async () => {
  const email = `signup-test-${randomUUID()}@example.test`;
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/auth`;
  const cookies = new Map<string, string>();
  let csrf = "";
  async function request(path: string, body?: object) {
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        Origin: config.FRONTEND_URL,
        Cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join("; "),
        ...(body
          ? { "Content-Type": "application/json", "x-csrf-token": csrf }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    for (const raw of response.headers.getSetCookie()) {
      const [pair] = raw.split(";");
      const at = pair.indexOf("=");
      cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    return { status: response.status, data: await response.json() };
  }
  try {
    csrf = (await request("/csrf")).data.csrfToken;
    const signup = await request("/register", {
      email,
      name: "Signup Test",
      password: "Test!234",
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.data.user.role, "student");
    assert.equal(signup.data.challengeId, undefined);
    assert.equal((await request("/me")).data.user.id, signup.data.user.id);
    assert.equal(testOutbox.filter((mail) => mail.to === email).length, 0);
    assert.equal(
      await db.authChallenge.count({ where: { userId: signup.data.user.id } }),
      0,
    );
    assert.equal(
      (
        await request("/register", {
          email,
          name: "Replacement",
          password: "Other!234",
        })
      ).status,
      409,
    );
    await request("/logout", {});
    assert.equal(
      (
        await request("/login", {
          email,
          password: "Test!234",
          portal: "learner",
        })
      ).status,
      200,
    );
    await request("/logout", {});
    await db.user.update({ where: { email }, data: { emailVerifiedAt: null } });
    assert.equal(
      (
        await request("/login", {
          email,
          password: "Test!234",
          portal: "learner",
        })
      ).status,
      200,
    );
    assert.ok((await request("/me")).data.user);
    await db.user.update({
      where: { email },
      data: { suspendedAt: new Date() },
    });
    assert.equal(
      (
        await request("/login", {
          email,
          password: "Test!234",
          portal: "learner",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/register", {
          email: `admin-${email}`,
          name: "Invalid Admin",
          password: "Test!234",
          role: "admin",
        })
      ).status,
      403,
    );
  } finally {
    await db.user.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    closeMail();
    await db.$disconnect();
  }
});
