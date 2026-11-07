import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { validateFile } = await import("../src/files/validation.js");

test("uploads reject disguised files, invalid text, empty and oversized files", async () => {
  const file = (name: string, value: string, size?: number) => ({
    originalname: name,
    buffer: Buffer.from(value),
    size: size ?? Buffer.byteLength(value),
  });
  assert.equal(
    (await validateFile(file("work.txt", "My assignment"), "assignment")).mime,
    "text/plain",
  );
  await assert.rejects(
    validateFile(file("fake.pdf", "<script>alert(1)</script>"), "resource"),
  );
  await assert.rejects(
    validateFile(file("work.txt", "bad\0text"), "assignment"),
  );
  await assert.rejects(validateFile(file("work.exe", "hello"), "assignment"));
  await assert.rejects(validateFile(file("work.txt", ""), "assignment"));
  await assert.rejects(
    validateFile(file("work.txt", "hello", 21 * 1024 * 1024), "resource"),
  );
  await assert.rejects(validateFile(file("work.txt", "hello"), "photo"));
  await assert.rejects(
    validateFile(
      { originalname: "bad.txt", buffer: Buffer.from([0xff]), size: 1 },
      "assignment",
    ),
  );
});

test(
  "Cloudinary upload, protected download, assignment review and live overview",
  { skip: process.env.RUN_CLOUDINARY_TESTS !== "1", timeout: 180000 },
  async (t) => {
    const { app } = await import("../src/app.js");
    const { db } = await import("../src/db.js");
    const { config, SESSION_COOKIE } = await import("../src/config.js");
    const { digest, token } = await import("../src/auth/crypto.js");
    const { curriculum } = await import("../src/content/curriculum.js");
    const { destroyFile } = await import("../src/files/storage.js");
    const suffix = randomUUID(),
      courseId = "upload-test-" + suffix,
      userIds: string[] = [],
      assetIds: string[] = [];
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = "http://127.0.0.1:" + address.port;
    async function client(role?: "ADMIN" | "STUDENT", verified = true) {
      const cookies = new Map<string, string>();
      let csrf = "",
        id = "";
      if (role) {
        const u = await db.user.create({
          data: {
            email: "upload-test-" + randomUUID() + "@example.test",
            name: "Upload test",
            passwordHash: "not-for-login",
            role,
            emailVerifiedAt: verified ? new Date() : null,
          },
        });
        id = u.id;
        userIds.push(id);
        const raw = token();
        await db.session.create({
          data: {
            userId: id,
            tokenHash: digest(raw),
            expiresAt: new Date(Date.now() + 3600000),
          },
        });
        cookies.set(SESSION_COOKIE, raw);
      }
      return {
        id,
        async request(
          path: string,
          body?: unknown,
          method = body === undefined ? "GET" : "POST",
        ) {
          if (method !== "GET" && !csrf) {
            const r = await fetch(base + "/auth/csrf");
            for (const raw of r.headers.getSetCookie()) {
              const p = raw.split(";")[0],
                at = p.indexOf("=");
              cookies.set(p.slice(0, at), p.slice(at + 1));
            }
            csrf = (await r.json()).csrfToken;
          }
          const multipart = body instanceof FormData;
          return fetch(base + path.replace(/^\/api\//, "/"), {
            method,
            redirect: "manual",
            headers: {
              Origin: config.FRONTEND_URL,
              Cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
              ...(method === "GET"
                ? {}
                : {
                    "X-CSRF-Token": csrf,
                    ...(multipart
                      ? {}
                      : { "Content-Type": "application/json" }),
                  }),
            },
            ...(body === undefined
              ? {}
              : { body: multipart ? body : JSON.stringify(body) }),
          });
        },
        async action(action: string, payload: unknown = {}) {
          const r = await this.request("/learning/actions", {
            action,
            payload,
          });
          const d = await r.json();
          assert.equal(r.status, 200, JSON.stringify(d));
          return d;
        },
        async state() {
          const r = await this.request("/learning/state");
          assert.equal(r.status, 200);
          return r.json();
        },
      };
    }
    const admin = await client("ADMIN"),
      learner = await client("STUDENT"),
      other = await client("STUDENT"),
      unverified = await client("STUDENT", false),
      anonymous = await client();
    const course = structuredClone(curriculum[0]);
    course.id = courseId;
    course.version = 0;
    course.title = "Upload integration test";
    course.modules = course.modules.slice(0, 1);
    course.modules[0].id = randomUUID();
    course.modules[0].lessons = course.modules[0].lessons.slice(0, 1);
    course.modules[0].lessons[0].id = randomUUID();
    const lesson = course.modules[0].lessons[0];
    const text = "Cloudinary end-to-end learning resource " + suffix;
    function form(
      purpose: string,
      name = "learning-resource.txt",
      content = text,
    ) {
      const f = new FormData();
      f.set("purpose", purpose);
      f.set("courseId", courseId);
      f.set("file", new Blob([content], { type: "text/plain" }), name);
      return f;
    }
    async function upload(who: typeof admin, purpose: string) {
      const r = await who.request("/files", form(purpose));
      const d = await r.json();
      assert.equal(r.status, 201, JSON.stringify(d));
      assetIds.push(d.id);
      return d;
    }
    async function overview() {
      const r = await admin.request("/learning/overview");
      assert.equal(r.status, 200);
      return r.json();
    }
    try {
      const before = await overview();
      await admin.action("saveCourse", { course });
      course.version++;
      await t.test(
        "administrator-only upload and file signature enforcement",
        async () => {
          assert.equal(
            (await anonymous.request("/files", form("resource"))).status,
            401,
          );
          assert.equal(
            (await learner.request("/files", form("resource"))).status,
            403,
          );
          assert.equal(
            (
              await admin.request(
                "/files",
                form("resource", "fake.pdf", "not a pdf"),
              )
            ).status,
            400,
          );
          assert.equal(
            (await learner.request("/learning/overview")).status,
            403,
          );
        },
      );
      const resource = await upload(admin, "resource");
      await t.test(
        "resource access requires a published lesson and enrollment",
        async () => {
          assert.equal((await anonymous.request(resource.url)).status, 401);
          assert.equal((await learner.request(resource.url)).status, 403);
          lesson.resourceUrl = resource.url;
          await admin.action("saveCourse", { course });
          course.version++;
          assert.equal((await learner.request(resource.url)).status, 403);
          await learner.action("enroll");
          const r = await learner.request(resource.url);
          assert.equal(r.status, 302);
          const downloaded = await fetch(r.headers.get("location")!);
          assert.equal(downloaded.status, 200);
          assert.equal(await downloaded.text(), text);
          const stored = await db.fileAsset.findUniqueOrThrow({
            where: { id: resource.id },
          });
          assert.equal(stored.deliveryType, "authenticated");
          assert.equal(
            (await admin.request(resource.url, {}, "DELETE")).status,
            409,
          );
        },
      );
      const assignment = await upload(learner, "assignment");
      await t.test(
        "private assignment submission, administrator download and review",
        async () => {
          await other.action("enroll");
          assert.equal((await other.request(assignment.url)).status, 403);
          assert.equal(
            (
              await other.request("/learning/actions", {
                action: "assignment",
                payload: { courseId, file: assignment.id },
              })
            ).status,
            403,
          );
          await learner.action("assignment", {
            courseId,
            content: "",
            file: assignment.id,
          });
          const submitted = (await learner.state()).submissions.find(
            (s: any) => s.course_id === courseId,
          );
          assert.equal(submitted.attachment.id, assignment.id);
          assert.equal(submitted.attachment.name, "learning-resource.txt");
          const r = await admin.request(assignment.url);
          assert.equal(r.status, 302);
          const d = await fetch(r.headers.get("location")!);
          assert.equal(d.status, 200);
          assert.equal(await d.text(), text);
          assert.equal(
            (await learner.request(assignment.url, {}, "DELETE")).status,
            409,
          );
          const waiting = await overview();
          assert.equal(waiting.pendingReviews, before.pendingReviews + 1);
          await admin.action("grade", {
            id: submitted.id,
            status: "graded",
            feedback: "Reviewed attachment",
          });
          assert.equal(
            (await learner.state()).submissions.find(
              (s: any) => s.id === submitted.id,
            ).feedback,
            "Reviewed attachment",
          );
          assert.equal(
            (await overview()).pendingReviews,
            before.pendingReviews,
          );
        },
      );
      await t.test(
        "overview counts verified enrolled learners and current lessons only",
        async () => {
          await db.learningRecord.createMany({
            data: [
              {
                userId: admin.id,
                kind: "enroll",
                key: "program",
                document: {},
              },
              {
                userId: unverified.id,
                kind: "enroll",
                key: "program",
                document: {},
              },
              {
                userId: admin.id,
                kind: "progress",
                key: lesson.id,
                document: { completed: 1 },
              },
              {
                userId: unverified.id,
                kind: "progress",
                key: lesson.id,
                document: { completed: 1 },
              },
              {
                userId: learner.id,
                kind: "progress",
                key: "removed-" + suffix,
                document: { completed: 1 },
              },
            ],
          });
          const oldRevision = (await admin.state()).revision;
          await learner.action("progress", {
            lessonId: lesson.id,
            completed: true,
          });
          const now = await overview();
          assert.equal(now.enrolledLearners, before.enrolledLearners + 2);
          assert.equal(now.completedLessons, before.completedLessons + 1);
          assert.equal(now.publishedCourses, before.publishedCourses + 1);
          const own = now.courseProgress.find((c: any) => c.id === courseId);
          assert.equal(own.completed, 1);
          assert.equal(own.lessonCount, 1);
          assert.equal(own.possible, now.enrolledLearners);
          assert.ok(own.percent >= 0 && own.percent <= 100);
          assert.notEqual((await admin.state()).revision, oldRevision);
          assert.ok(
            !(await learner.state()).progress.some(
              (p: any) => p.lesson_id === "removed-" + suffix,
            ),
          );
          await learner.action("bookmark", { courseId, saved: true });
          assert.ok((await learner.state()).saved.includes(courseId));
          assert.ok(!(await other.state()).saved.includes(courseId));
          await learner.action("bookmark", { courseId, saved: false });
          assert.ok(!(await learner.state()).saved.includes(courseId));
          await admin.action("deleteCourse", { courseId });
          assert.equal(
            (await overview()).completedLessons,
            before.completedLessons,
          );
          assert.equal((await learner.request(resource.url)).status, 403);
        },
      );
      await t.test(
        "unused uploads can be deleted from database and Cloudinary",
        async () => {
          const unused = await upload(admin, "resource");
          assert.equal(
            (await admin.request(unused.url, {}, "DELETE")).status,
            200,
          );
          assert.equal(
            await db.fileAsset.findUnique({ where: { id: unused.id } }),
            null,
          );
          assert.equal((await admin.request(unused.url)).status, 404);
        },
      );
    } finally {
      await db.courseVersion.deleteMany({ where: { courseId } });
      await db.course.deleteMany({ where: { id: courseId } });
      const assets = await db.fileAsset.findMany({
        where: { id: { in: assetIds } },
      });
      for (const a of assets) await destroyFile(a);
      await db.fileAsset.deleteMany({ where: { id: { in: assetIds } } });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
      await db.academySetting.deleteMany({
        where: { id: { in: userIds.map((id) => "learning:user:" + id) } },
      });
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
      await db.$disconnect();
    }
  },
);
