import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { config, SESSION_COOKIE } = await import("../src/config.js");
const { token, digest } = await import("../src/auth/crypto.js");
const { certificateSettingsSchema } =
  await import("../src/learning/certificates.js");
test(
  "free certificates: permissions, completion rules, issuance, immutable snapshots and public verification",
  { timeout: 180000 },
  async () => {
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = "http://127.0.0.1:" + address.port,
      ids: string[] = [];
    const original = await db.academySetting.findUnique({
      where: { id: "certificates" },
    });
    async function account(role: "STUDENT" | "ADMIN") {
      const user = await db.user.create({
        data: {
          role,
          name: "Certificate Test",
          email: `cert-${randomUUID()}@example.test`,
          passwordHash: "unused-test-hash",
          emailVerifiedAt: new Date(),
        },
      });
      ids.push(user.id);
      const raw = token();
      await db.session.create({
        data: {
          userId: user.id,
          tokenHash: digest(raw),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      const cookies = new Map([[SESSION_COOKIE, raw]]);
      let csrf = "";
      async function request(
        path: string,
        body?: unknown,
        method = body === undefined ? "GET" : "POST",
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
        for (const rawCookie of res.headers.getSetCookie()) {
          const pair = rawCookie.split(";")[0],
            at = pair.indexOf("=");
          cookies.set(pair.slice(0, at), pair.slice(at + 1));
        }
        return { status: res.status, data: await res.json() };
      }
      return { user, request };
    }
    try {
      const admin = await account("ADMIN"),
        learner = await account("STUDENT"),
        other = await account("STUDENT");
      const settings = certificateSettingsSchema.parse({
        programName: "Certificate Test Program",
        issuer: "Test Academy",
        requireAssignments: true,
        requireFinalAssessment: true,
      });
      assert.equal((await learner.request("/admin/certificates")).status, 403);
      assert.equal(
        (
          await learner.request(
            "/admin/certificates/settings",
            settings,
            "PATCH",
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await admin.request(
            "/admin/certificates/settings",
            { ...settings, fee: 100 },
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (await admin.request("/admin/certificates/settings", settings, "PATCH"))
          .status,
        200,
      );
      assert.equal(
        (
          await admin.request("/admin/certificates/issue", {
            userId: learner.user.id,
          })
        ).status,
        400,
      );
      await db.learningRecord.create({
        data: {
          userId: learner.user.id,
          kind: "enroll",
          key: "program",
          document: {},
        },
      });
      const courses = await db.course.findMany({
        where: { status: "published", deletedAt: null },
      });
      assert.ok(courses.length > 0);
      for (const c of courses) {
        const course = c.document as any;
        for (const module of course.modules)
          for (const lesson of module.lessons)
            await db.learningRecord.create({
              data: {
                userId: learner.user.id,
                kind: "progress",
                key: lesson.id,
                document: { completed: 1 },
              },
            });
        await db.quizAttempt.create({
          data: {
            userId: learner.user.id,
            courseId: c.id,
            status: "graded",
            score: 100,
            assessment: course.quiz,
          },
        });
      }
      assert.equal(
        (await learner.request("/learning/actions", { action: "certificate" }))
          .status,
        400,
        "Assignments and final assessment must be completed",
      );
      for (const c of courses)
        if ((c.document as any).assignment.prompt.trim())
          await db.learningRecord.create({
            data: {
              userId: learner.user.id,
              kind: "assignment",
              key: c.id,
              document: { status: "graded" },
            },
          });
      assert.equal(
        (await learner.request("/learning/actions", { action: "certificate" }))
          .status,
        400,
        "Final assessment is enforced",
      );
      await db.quizAttempt.create({
        data: {
          userId: learner.user.id,
          courseId: "program",
          status: "graded",
          score: 70,
          assessment: (courses[0].document as any).quiz,
        },
      });
      await db.user.update({
        where: { id: learner.user.id },
        data: { suspendedAt: new Date() },
      });
      assert.equal(
        (
          await admin.request("/admin/certificates/issue", {
            userId: learner.user.id,
          })
        ).status,
        400,
        "Suspended learners cannot be certified",
      );
      await db.user.update({
        where: { id: learner.user.id },
        data: { suspendedAt: null },
      });
      const register = await admin.request(
        "/admin/certificates?status=eligible&search=" +
          encodeURIComponent(learner.user.email),
      );
      assert.equal(register.status, 200);
      assert.equal(register.data.learners.length, 1);
      assert.equal(register.data.learners[0].status, "eligible");
      await admin.request(
        "/admin/certificates/settings",
        { ...settings, enabled: false },
        "PATCH",
      );
      assert.equal(
        (
          await admin.request("/admin/certificates/issue", {
            userId: learner.user.id,
          })
        ).status,
        400,
        "Issuance pause enforced",
      );
      await admin.request("/admin/certificates/settings", settings, "PATCH");
      const issued = await Promise.all([
        admin.request("/admin/certificates/issue", { userId: learner.user.id }),
        admin.request("/admin/certificates/issue", { userId: learner.user.id }),
      ]);
      assert.deepEqual(
        issued.map((r) => r.status),
        [200, 200],
      );
      const certificate = issued[0].data.certificate;
      assert.equal(
        certificate.id,
        issued[1].data.certificate.id,
        "Concurrent requests issue only once",
      );
      assert.equal(certificate.fee, 0);
      assert.equal(certificate.issuedBy, undefined);
      await admin.request(
        "/admin/certificates/settings",
        { ...settings, issuer: "Changed issuer" },
        "PATCH",
      );
      await db.user.update({
        where: { id: learner.user.id },
        data: { name: "Changed name" },
      });
      const publicRes = await fetch(
        base + "/learning/certificates/" + certificate.id,
      );
      assert.equal(publicRes.status, 200);
      const verified = (await publicRes.json()).certificate;
      assert.equal(verified.issuer, "Test Academy");
      assert.equal(verified.name, "Certificate Test");
      assert.equal(verified.email, undefined);
      assert.equal(verified.issuedBy, undefined);
      assert.equal(
        (await learner.request("/learning/state")).data.certificates[0].id,
        certificate.id,
      );
      assert.equal(
        (await other.request("/learning/state")).data.certificates.length,
        0,
      );
      assert.equal(
        (
          await other.request("/learning/actions", {
            action: "certificate",
            payload: { userId: learner.user.id },
          })
        ).status,
        400,
        "Cannot claim another learner's achievement",
      );
      assert.equal(
        (await admin.request("/learning/actions", { action: "certificate" }))
          .status,
        403,
      );
      const issuedRegister = await admin.request(
        "/admin/certificates?status=issued&search=" +
          encodeURIComponent(learner.user.email),
      );
      assert.equal(
        issuedRegister.data.learners[0].certificateId,
        certificate.id,
      );
      assert.equal(
        (await fetch(base + "/learning/certificates/missing-reference")).status,
        404,
      );
    } finally {
      if (original)
        await db.academySetting.upsert({
          where: { id: "certificates" },
          create: { id: "certificates", document: original.document! },
          update: { document: original.document! },
        });
      else
        await db.academySetting.deleteMany({ where: { id: "certificates" } });
      await db.academySetting.deleteMany({
        where: { id: { in: ids.map((id) => "learning:user:" + id) } },
      });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
