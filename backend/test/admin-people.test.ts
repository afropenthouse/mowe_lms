import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { config, SESSION_COOKIE } = await import("../src/config.js");
const { digest, token, hashPassword, protectedDigest } =
  await import("../src/auth/crypto.js");
const { testOutbox } = await import("../src/mail.js");
const { curriculum } = await import("../src/content/curriculum.js");
test(
  "learner directory, suspension boundaries and administrator invitations",
  { timeout: 240000 },
  async (t) => {
    const prefix = "people-test-" + randomUUID(),
      password = "People123!",
      ids: string[] = [],
      emails: string[] = [],
      courseIds = [
        prefix + "-published",
        prefix + "-draft",
        prefix + "-archived",
      ];
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = "http://127.0.0.1:" + address.port;
    function client(raw?: string) {
      const cookies = new Map<string, string>();
      if (raw) cookies.set(SESSION_COOKIE, raw);
      let csrf = "";
      return {
        async request(
          path: string,
          body?: unknown,
          method = body === undefined ? "GET" : "POST",
        ) {
          if (body !== undefined && !csrf)
            csrf = (await this.request("/auth/csrf")).data.csrfToken;
          const response = await fetch(base + path, {
            method,
            headers: {
              Origin: config.FRONTEND_URL,
              Cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
              ...(body === undefined
                ? {}
                : { "Content-Type": "application/json", "X-CSRF-Token": csrf }),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          });
          for (const raw of response.headers.getSetCookie()) {
            const p = raw.split(";")[0],
              at = p.indexOf("=");
            cookies.set(p.slice(0, at), p.slice(at + 1));
          }
          return {
            status: response.status,
            data: response.headers
              .get("content-type")
              ?.includes("application/json")
              ? await response.json()
              : await response.text(),
          };
        },
      };
    }
    async function session(userId: string) {
      const raw = token();
      await db.session.create({
        data: {
          userId,
          tokenHash: digest(raw),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      return client(raw);
    }
    try {
      const passwordHash = await hashPassword(password);
      await db.user.createMany({
        data: Array.from({ length: 23 }, (_, i) => ({
          email: prefix + "-" + i + "@example.test",
          name: i === 0 ? "=Test spreadsheet formula" : "Learner " + i,
          passwordHash,
          emailVerifiedAt: i === 22 ? null : new Date(),
        })),
      });
      const students = await db.user.findMany({
        where: { email: { startsWith: prefix } },
        orderBy: { email: "asc" },
      });
      ids.push(...students.map((u) => u.id));
      emails.push(...students.map((u) => u.email));
      const adminUser = await db.user.create({
        data: {
          email: prefix + "-admin@example.test",
          name: "Directory Admin",
          role: "SUPERADMIN",
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      });
      ids.push(adminUser.id);
      emails.push(adminUser.email);
      const admin = await session(adminUser.id),
        target = students.find((u) => u.email === prefix + "-0@example.test")!,
        pending = students.find((u) => !u.emailVerifiedAt)!,
        learner = await session(target.id),
        otherSession = await session(target.id);
      const publishedLesson = randomUUID(),
        draftLesson = randomUUID(),
        archivedLesson = randomUUID();
      for (let i = 0; i < 3; i++) {
        const c = structuredClone(curriculum[0]);
        c.id = courseIds[i];
        c.modules = c.modules.slice(0, 1);
        c.modules[0].id = randomUUID();
        c.modules[0].lessons = c.modules[0].lessons.slice(0, 1);
        c.modules[0].lessons[0].id = [
          publishedLesson,
          draftLesson,
          archivedLesson,
        ][i];
        c.status = i === 1 ? "draft" : "published";
        await db.course.create({
          data: {
            id: c.id,
            title: c.title,
            position: 999,
            status: c.status,
            document: c,
            deletedAt: i === 2 ? new Date() : null,
          },
        });
      }
      await db.learningRecord.createMany({
        data: [
          { userId: target.id, kind: "enroll", key: "program", document: {} },
          ...[publishedLesson, draftLesson, archivedLesson].map((key) => ({
            userId: target.id,
            kind: "progress",
            key,
            document: { completed: 1 },
          })),
        ],
      });
      await db.quizAttempt.createMany({
        data: [
          {
            userId: target.id,
            courseId: courseIds[0],
            assessment: curriculum[0].quiz,
            status: "graded",
            score: 80,
          },
          {
            userId: target.id,
            courseId: courseIds[2],
            assessment: curriculum[0].quiz,
            status: "graded",
            score: 100,
          },
        ],
      });
      const query = "?search=" + prefix;
      await t.test(
        "directory is admin-only, searchable and paginated, with active-course totals",
        async () => {
          assert.equal((await client().request("/admin/learners")).status, 401);
          assert.equal((await learner.request("/admin/learners")).status, 403);
          assert.equal((await learner.request("/admin/team")).status, 403);
          const first = await admin.request("/admin/learners" + query);
          assert.equal(first.status, 200, JSON.stringify(first.data));
          assert.equal(first.data.total, 23);
          assert.equal(first.data.learners.length, 20);
          const second = await admin.request(
            "/admin/learners" + query + "&page=2",
          );
          assert.equal(second.data.learners.length, 3);
          assert.ok(
            !first.data.learners.some((a: any) =>
              second.data.learners.some((b: any) => a.id === b.id),
            ),
          );
          const record = (
            await admin.request(
              "/admin/learners?search=" + target.studentNumber,
            )
          ).data.learners[0];
          assert.equal(record.completedLessons, 1);
          assert.equal(record.quizAverage, 80);
          assert.equal(record.gradedAttempts, 1);
          assert.ok(!("passwordHash" in record));
          assert.equal(
            (await admin.request("/admin/learners" + query + "&status=pending"))
              .data.total,
            1,
          );
          assert.equal(
            (
              await admin.request(
                "/admin/learners" + query + "&enrollment=enrolled",
              )
            ).data.total,
            1,
          );
          const exported = await admin.request(
            "/admin/learners/export" + query,
          );
          assert.equal(exported.status, 200);
          assert.equal(exported.data.split("\r\n").length, 24);
          assert.ok(exported.data.includes('"\'=Test spreadsheet formula"'));
        },
      );
      await t.test(
        "suspension revokes sessions, blocks sign-in and preserves learning records",
        async () => {
          const endpoint = "/admin/learners/" + target.id + "/status",
            payload = {
              status: "suspended",
              reason: "Access review requested",
            };
          assert.equal(
            (await learner.request(endpoint, payload, "PATCH")).status,
            403,
          );
          assert.equal(
            (
              await admin.request(
                "/admin/learners/" + adminUser.id + "/status",
                payload,
                "PATCH",
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await admin.request(
                endpoint,
                { status: "suspended", reason: "" },
                "PATCH",
              )
            ).status,
            400,
          );
          const suspended = await admin.request(endpoint, payload, "PATCH");
          assert.equal(suspended.status, 200, JSON.stringify(suspended.data));
          assert.equal((await learner.request("/auth/me")).data.user, null);
          assert.equal(
            (await otherSession.request("/auth/me")).data.user,
            null,
          );
          const login = await client().request("/auth/login", {
            email: target.email,
            password,
          });
          assert.equal(login.status, 403);
          assert.equal(login.data.code, "ACCOUNT_SUSPENDED");
          assert.equal(
            (
              await learner.request("/learning/actions", {
                action: "progress",
                payload: { lessonId: publishedLesson, completed: true },
              })
            ).status,
            401,
          );
          assert.equal(
            await db.learningRecord.count({ where: { userId: target.id } }),
            4,
          );
          assert.equal(
            (
              await admin.request(
                "/admin/learners" + query + "&status=suspended",
              )
            ).data.total,
            1,
          );
          assert.equal(
            (await admin.request(endpoint, { status: "active" }, "PATCH"))
              .status,
            200,
          );
          assert.equal((await learner.request("/auth/me")).data.user, null);
          assert.equal(
            (
              await client().request("/auth/login", {
                email: target.email,
                password,
              })
            ).status,
            200,
          );
          assert.equal(
            await db.learningRecord.count({ where: { userId: target.id } }),
            4,
          );
        },
      );
      await t.test(
        "verification cannot bypass suspension and reactivated unverified accounts can verify",
        async () => {
          const challengeId = randomUUID(),
            code = "123456";
          await db.authChallenge.create({
            data: {
              id: challengeId,
              userId: pending.id,
              purpose: "VERIFY_EMAIL",
              codeHash: protectedDigest(challengeId + ":" + code),
              expiresAt: new Date(Date.now() + 600000),
            },
          });
          const endpoint = "/admin/learners/" + pending.id + "/status";
          assert.equal(
            (
              await admin.request(
                endpoint,
                { status: "suspended", reason: "Pending account review" },
                "PATCH",
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await client().request("/auth/verify-email", {
                challengeId,
                code,
              })
            ).status,
            400,
          );
          const before = testOutbox.length;
          await client().request("/auth/register", {
            email: pending.email,
            name: "Attempted re-registration",
            password,
          });
          assert.equal(testOutbox.length, before);
          await admin.request(endpoint, { status: "active" }, "PATCH");
          const fresh = await client().request("/auth/login", {
            email: pending.email,
            password,
          });
          assert.equal(fresh.status, 403);
          assert.equal(fresh.data.code, "EMAIL_UNVERIFIED");
          assert.notEqual(fresh.data.challengeId, challengeId);
          const freshCode = testOutbox
            .filter((m) => m.to === pending.email)
            .at(-1)!
            .text.match(/\b\d{6}\b/)![0];
          assert.equal(
            (
              await client().request("/auth/verify-email", {
                challengeId: fresh.data.challengeId,
                code: freshCode,
              })
            ).status,
            200,
          );
        },
      );
      await t.test(
        "admins can invite, list and revoke invitations and new admins can register",
        async () => {
          const invited = prefix + "-invited@example.test",
            revoked = prefix + "-revoked@example.test";
          emails.push(invited, revoked);
          assert.equal(
            (
              await learner.request("/auth/admin-invitations", {
                email: invited,
              })
            ).status,
            401,
          );
          for (const email of [revoked, invited]) {
            const result = await admin.request("/auth/admin-invitations", {
              email,
            });
            assert.equal(result.status, 201, JSON.stringify(result.data));
            const team = await admin.request("/admin/team");
            assert.equal(team.status, 200);
            assert.ok(team.data.admins.some((u: any) => u.id === adminUser.id));
            const invitation = team.data.invitations.find(
              (i: any) => i.email === email,
            );
            assert.ok(invitation);
            assert.equal("tokenHash" in invitation, false);
            const inviteToken = testOutbox
              .filter((m) => m.to === email)
              .at(-1)!
              .text.match(/invite=([a-f0-9]{64})/)![1];
            if (email === revoked) {
              assert.equal(
                (
                  await admin.request(
                    "/admin/invitations/" + invitation.id,
                    {},
                    "DELETE",
                  )
                ).status,
                200,
              );
              assert.equal(
                (
                  await client().request("/auth/register", {
                    email,
                    name: "Revoked invite",
                    password,
                    role: "admin",
                    inviteToken,
                  })
                ).status,
                403,
              );
            } else {
              const recipient = client(),
                registered = await recipient.request("/auth/register", {
                  email,
                  name: "Invited administrator",
                  password,
                  role: "admin",
                  inviteToken,
                });
              assert.equal(registered.status, 201);
              const user = await db.user.findUniqueOrThrow({
                where: { email },
              });
              ids.push(user.id);
              const code = testOutbox
                .filter((m) => m.to === email)
                .at(-1)!
                .text.match(/\b\d{6}\b/)![0];
              const verified = await recipient.request("/auth/verify-email", {
                challengeId: registered.data.challengeId,
                code,
              });
              assert.equal(verified.status, 200);
              assert.equal(verified.data.user.role, "admin");
              assert.equal(
                (await recipient.request("/admin/team")).status,
                403,
              );
            }
          }
        },
      );
      await t.test(
        "only the Super Admin can remove and restore admins, and owner accounts stay protected",
        async () => {
          const regularUser = await db.user.findUniqueOrThrow({
            where: { email: prefix + "-invited@example.test" },
          });
          const regular = await session(regularUser.id),
            secondDevice = await session(regularUser.id);
          const anotherOwner = await db.user.create({
            data: {
              email: prefix + "-owner@example.test",
              name: "Second test owner",
              role: "SUPERADMIN",
              passwordHash,
              emailVerifiedAt: new Date(),
            },
          });
          ids.push(anotherOwner.id);
          emails.push(anotherOwner.email);
          await db.learningRecord.create({
            data: {
              userId: regularUser.id,
              kind: "comment",
              key: prefix + "-admin-note",
              document: { body: "Preserved administrator contribution" },
            },
          });
          const team = await regular.request("/admin/team");
          assert.equal(team.status, 403);
          assert.equal(
            (await regular.request("/admin/team?state=removed")).status,
            403,
          );
          assert.equal(
            (await regular.request("/auth/admin/users")).status,
            403,
          );
          assert.equal(
            (
              await regular.request("/auth/admin-invitations", {
                email: prefix + "-unauthorised@example.test",
              })
            ).status,
            403,
          );
          assert.equal(
            (
              await regular.request(
                "/admin/invitations/does-not-exist",
                {},
                "DELETE",
              )
            ).status,
            403,
          );
          const endpoint = "/admin/team/" + regularUser.id + "/access";
          assert.equal(
            (await regular.request(endpoint, { active: false }, "PATCH"))
              .status,
            403,
          );
          assert.equal(
            (
              await admin.request(
                "/admin/team/" + adminUser.id + "/access",
                { active: false },
                "PATCH",
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await admin.request(
                "/admin/team/" + anotherOwner.id + "/access",
                { active: false },
                "PATCH",
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await admin.request(
                "/admin/team/" + target.id + "/access",
                { active: false },
                "PATCH",
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await admin.request(
                endpoint,
                { active: false, role: "SUPERADMIN" },
                "PATCH",
              )
            ).status,
            400,
          );
          const removed = await admin.request(
            endpoint,
            { active: false },
            "PATCH",
          );
          assert.equal(removed.status, 200, JSON.stringify(removed.data));
          assert.equal((await regular.request("/auth/me")).data.user, null);
          assert.equal(
            (await secondDevice.request("/auth/me")).data.user,
            null,
          );
          const blocked = await client().request("/auth/login", {
            email: regularUser.email,
            password,
          });
          assert.equal(blocked.status, 403);
          assert.match(blocked.data.error, /removed/i);
          assert.equal((await regular.request("/admin/learners")).status, 401);
          assert.ok(
            !(await admin.request("/admin/team")).data.admins.some(
              (u: any) => u.id === regularUser.id,
            ),
          );
          assert.ok(
            (await admin.request("/admin/team?state=removed")).data.admins.some(
              (u: any) => u.id === regularUser.id,
            ),
          );
          assert.equal(
            await db.learningRecord.count({
              where: { userId: regularUser.id },
            }),
            1,
          );
          assert.equal(
            await db.course.count({ where: { id: { in: courseIds } } }),
            3,
          );
          assert.equal(
            (await admin.request(endpoint, { active: true }, "PATCH")).status,
            200,
          );
          assert.equal((await regular.request("/auth/me")).data.user, null);
          const restored = await client().request("/auth/login", {
            email: regularUser.email,
            password,
          });
          assert.equal(restored.status, 200);
          assert.equal(restored.data.user.isSuperAdmin, false);
          assert.equal(
            (await admin.request("/auth/me")).data.user.isSuperAdmin,
            true,
          );
        },
      );
    } finally {
      await db.user.deleteMany({ where: { email: { in: emails } } });
      await db.adminInvitation.deleteMany({ where: { email: { in: emails } } });
      await db.courseVersion.deleteMany({
        where: { courseId: { in: courseIds } },
      });
      await db.course.deleteMany({ where: { id: { in: courseIds } } });
      await db.academySetting.deleteMany({
        where: { id: { in: ids.map((id) => "learning:user:" + id) } },
      });
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.$disconnect();
    }
  },
);
