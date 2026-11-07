import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { config, SESSION_COOKIE } = await import("../src/config.js");
const { digest, token } = await import("../src/auth/crypto.js");
const { curriculum } = await import("../src/content/curriculum.js");
const { courseSchema } = await import("../src/learning/validation.js");
const { mergeExpandedLessons } = await import("../src/content/install.js");
const { withoutAnswers, gradeAssessment } =
  await import("../src/learning/assessment.js");

test("CBA content covers the active catalogue with ten explained questions per course", () => {
  assert.equal(curriculum.length, 3);
  assert.deepEqual(
    curriculum.map((c) => c.modules.length),
    [4, 4, 3],
  );
  for (const course of curriculum) {
    courseSchema.parse(course);
    assert.equal(course.quiz.questions.length, 10);
    assert.ok(course.modules.every((m) => m.lessons.length === 3));
    for (const m of course.modules)
      for (const l of m.lessons) {
        assert.ok(l.content.split(/\s+/).length >= 180, l.title);
        assert.equal(l.placeholder, false);
        for (const heading of [
          "What you will learn",
          "Workplace example",
          "Practice and reflection",
          "Key takeaway",
        ])
          assert.ok(l.content.includes(heading));
      }
    for (const q of withoutAnswers(course).quiz.questions) {
      assert.equal("answer" in q, false);
      assert.equal("explanation" in q, false);
    }
    const correct = Object.fromEntries(
      course.quiz.questions.map((q) => [q.id, q.answer]),
    );
    assert.equal(gradeAssessment(course.quiz, correct, false).score, 100);
    assert.equal(gradeAssessment(course.quiz, correct, true).score, 0);
  }
});

test("course expansion preserves admin edits, removed modules and existing lesson IDs", () => {
  const expanded = curriculum[0];
  const current = structuredClone(expanded);
  current.title = "Administrator-edited title";
  current.modules = current.modules
    .slice(0, 3)
    .map((m) => ({ ...m, lessons: m.lessons.slice(0, 1) }));
  current.modules[0].lessons[0].content =
    "An administrator's own lesson content";
  const merged = mergeExpandedLessons(current, expanded);
  assert.equal(merged.added, 6);
  assert.equal(merged.document.title, current.title);
  assert.equal(merged.document.modules.length, 3);
  assert.equal(
    merged.document.modules[0].lessons[0].content,
    current.modules[0].lessons[0].content,
  );
  assert.equal(mergeExpandedLessons(merged.document, expanded).added, 0);
});

test("shared content, administrator permissions and assessment lifecycle", async (t) => {
  const suffix = randomUUID(),
    courseId = "learning-test-" + suffix;
  const userIds: string[] = [];
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = "http://127.0.0.1:" + address.port;
  async function client(role?: "STUDENT" | "ADMIN") {
    const cookies = new Map<string, string>();
    if (role) {
      const user = await db.user.create({
        data: {
          email: "learning-test-" + randomUUID() + "@example.test",
          name: "Learning Test",
          passwordHash: "not-for-login",
          role,
          emailVerifiedAt: new Date(),
        },
      });
      userIds.push(user.id);
      const raw = token();
      await db.session.create({
        data: {
          userId: user.id,
          tokenHash: digest(raw),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      cookies.set(SESSION_COOKIE, raw);
    }
    let csrf = "";
    return {
      async request(path: string, body?: unknown, namespace = "/learning") {
        if (body !== undefined && !csrf) {
          const response = await fetch(base + "/auth/csrf");
          for (const raw of response.headers.getSetCookie()) {
            const pair = raw.split(";")[0],
              at = pair.indexOf("=");
            cookies.set(pair.slice(0, at), pair.slice(at + 1));
          }
          csrf = (await response.json()).csrfToken;
        }
        const response = await fetch(base + namespace + path, {
          method: body === undefined ? "GET" : "POST",
          headers: {
            Origin: config.FRONTEND_URL,
            Cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
            ...(body === undefined
              ? {}
              : { "Content-Type": "application/json", "X-CSRF-Token": csrf }),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return { status: response.status, data: await response.json() };
      },
      action(action: string, payload: unknown = {}) {
        return this.request("/actions", { action, payload });
      },
    };
  }
  const administrator = await client("ADMIN"),
    learner = await client("STUDENT"),
    other = await client("STUDENT"),
    visitor = await client();
  const c = {
    ...structuredClone(curriculum[0]),
    id: courseId,
    version: 0,
    status: "draft" as const,
    quiz: { ...structuredClone(curriculum[0].quiz), timeLimit: 1 },
  };
  let attemptId = "",
    submissionId = "";
  try {
    await t.test(
      "only admins can author, and only published courses reach learners",
      async () => {
        assert.equal(
          (await visitor.action("saveCourse", { course: c })).status,
          401,
        );
        assert.equal(
          (await learner.action("saveCourse", { course: c })).status,
          403,
        );
        assert.equal(
          (await administrator.action("saveCourse", { course: c })).status,
          200,
        );
        assert.ok(
          !(await learner.request("/state")).data.courses.some(
            (v: any) => v.id === courseId,
          ),
        );
        assert.ok(
          (await administrator.request("/state")).data.courses.some(
            (v: any) => v.id === courseId,
          ),
        );
        const published = { ...c, status: "published", version: 1 };
        assert.equal(
          (await administrator.action("saveCourse", { course: published }))
            .status,
          200,
        );
        assert.equal(
          (await administrator.action("saveCourse", { course: published }))
            .status,
          409,
        );
        const visible = (await visitor.request("/state")).data.courses.find(
          (v: any) => v.id === courseId,
        );
        assert.ok(visible);
        assert.equal("answer" in visible.quiz.questions[0], false);
        assert.equal("explanation" in visible.quiz.questions[0], false);
        assert.ok((await db.courseVersion.count({ where: { courseId } })) > 0);
      },
    );
    await t.test(
      "authoring rejects unsafe links and incomplete published lessons",
      async () => {
        const current = { ...c, status: "published", version: 2 };
        const unsafe = structuredClone(current);
        unsafe.modules[0].lessons[0].resourceUrl = "javascript:alert(1)";
        assert.equal(
          (await administrator.action("saveCourse", { course: unsafe })).status,
          400,
        );
        const incomplete = structuredClone(current);
        incomplete.modules[0].lessons[0].placeholder = true;
        assert.equal(
          (await administrator.action("saveCourse", { course: incomplete }))
            .status,
          400,
        );
      },
    );
    await t.test(
      "enrollment and progress are persisted and scoped to the account",
      async () => {
        assert.equal(
          (await learner.action("quizStart", { courseId })).status,
          403,
        );
        assert.equal((await learner.action("enroll")).status, 200);
        assert.equal(
          (
            await learner.action("progress", {
              lessonId: c.modules[0].lessons[0].id,
              completed: true,
              note: "Private test note",
            })
          ).status,
          200,
        );
        assert.ok(
          (await learner.request("/state")).data.progress.some(
            (v: any) => v.note === "Private test note",
          ),
        );
        assert.equal((await other.request("/state")).data.progress.length, 0);
      },
    );
    await t.test(
      "concurrent starts reuse one assessment snapshot and hide answers",
      async () => {
        const results = await Promise.all([
          learner.action("quizStart", { courseId }),
          learner.action("quizStart", { courseId }),
        ]);
        assert.equal(results[0].status, 200);
        assert.equal(results[1].status, 200);
        attemptId = results[0].data.attemptId;
        assert.equal(attemptId, results[1].data.attemptId);
        assert.equal("answer" in results[0].data.quiz.questions[0], false);
        assert.equal(await db.quizAttempt.count({ where: { courseId } }), 1);
      },
    );
    await t.test(
      "grading uses the server snapshot, prevents tampering and rejects replay",
      async () => {
        const answers = Object.fromEntries(
          c.quiz.questions.map((q) => [q.id, q.answer]),
        );
        assert.equal(
          (await other.action("quizSubmit", { attemptId, answers })).status,
          404,
        );
        assert.equal(
          (
            await learner.action("quizSubmit", {
              attemptId,
              answers,
              score: 100,
            })
          ).status,
          400,
        );
        const r = await learner.action("quizSubmit", { attemptId, answers });
        assert.equal(r.status, 200);
        assert.equal(r.data.score, 100);
        assert.equal(r.data.feedback.length, 10);
        assert.equal(
          (await learner.action("quizSubmit", { attemptId, answers })).status,
          409,
        );
      },
    );
    await t.test("server enforces time and attempt limits", async () => {
      const started = await learner.action("quizStart", { courseId });
      await db.quizAttempt.update({
        where: { id: started.data.attemptId },
        data: { startedAt: new Date(Date.now() - 120000) },
      });
      const answers = Object.fromEntries(
        c.quiz.questions.map((q) => [q.id, q.answer]),
      );
      const expired = await learner.action("quizSubmit", {
        attemptId: started.data.attemptId,
        answers,
      });
      assert.equal(expired.data.expired, true);
      assert.equal(expired.data.score, 0);
      const third = await learner.action("quizStart", { courseId });
      await learner.action("quizSubmit", {
        attemptId: third.data.attemptId,
        answers,
      });
      assert.equal(
        (await learner.action("quizStart", { courseId })).status,
        400,
      );
    });
    await t.test(
      "admins can review a written assignment and learners see feedback",
      async () => {
        assert.equal(
          (
            await learner.action("assignment", {
              courseId,
              content:
                "A sufficiently detailed fictional workplace response for review.",
            })
          ).status,
          200,
        );
        const s = (await learner.request("/state")).data.submissions.find(
          (v: any) => v.course_id === courseId,
        );
        submissionId = s.id;
        const originalReview = await administrator.request(
          "/reviews?kind=assignments",
          undefined,
          "/admin",
        );
        assert.equal(originalReview.status, 200);
        const original = originalReview.data.items.find(
          (item: { id: string }) => item.id === s.id,
        );
        assert.ok(original);
        assert.equal(
          (
            await other.action("grade", {
              id: s.id,
              status: "graded",
              feedback: "Unapproved",
            })
          ).status,
          403,
        );
        const revisedContent =
          "An updated fictional workplace response for review.";
        assert.equal(
          (
            await learner.action("assignment", {
              courseId,
              content: revisedContent,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await administrator.action("grade", {
              id: s.id,
              status: "graded",
              feedback: "Stale feedback",
              expectedUpdatedAt: original.updatedAt,
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await administrator.action("grade", {
              id: s.id,
              status: "graded",
              feedback: "Clear analysis.",
            })
          ).status,
          200,
        );
        const updated = (await learner.request("/state")).data.submissions.find(
          (v: any) => v.id === submissionId,
        );
        assert.equal(updated.feedback, "Clear analysis.");
        assert.equal(updated.status, "graded");
        assert.equal(updated.content, revisedContent);
      },
    );
    await t.test(
      "assessment review keeps original questions and selected options after editing the course",
      async () => {
        const originalChoice = c.quiz.questions[0];
        const short = {
          id: "review-short-answer",
          type: "short",
          prompt: "Original short-answer question",
          options: [],
          answer: "",
          explanation: "",
        };
        const originalQuiz = { ...c.quiz, questions: [originalChoice, short] };
        const published = {
          ...c,
          version: 2,
          status: "published",
          quiz: originalQuiz,
        };
        assert.equal(
          (await administrator.action("saveCourse", { course: published }))
            .status,
          200,
        );
        assert.equal((await other.action("enroll")).status, 200);
        const started = await other.action("quizStart", { courseId });
        assert.equal(started.status, 200);
        const editedQuiz = {
          ...originalQuiz,
          questions: [
            {
              ...originalChoice,
              prompt: "Updated choice question",
              options: ["Changed option one", "Changed option two"],
              answer: 1,
            },
            { ...short, prompt: "Updated short-answer question" },
          ],
        };
        assert.equal(
          (
            await administrator.action("saveCourse", {
              course: { ...published, version: 3, quiz: editedQuiz },
            })
          ).status,
          200,
        );
        const attemptId = started.data.attemptId;
        const submitted = await other.action("quizSubmit", {
          attemptId,
          answers: {
            [originalChoice.id]: 0,
            [short.id]: "Original written response",
          },
        });
        assert.equal(submitted.status, 200);
        assert.equal(submitted.data.status, "pending");
        for (const [account, status] of [
          [visitor, 401],
          [learner, 403],
        ] as const) {
          assert.equal(
            (
              await account.request(
                "/reviews?kind=quizzes",
                undefined,
                "/admin",
              )
            ).status,
            status,
          );
        }
        const review = await administrator.request(
          "/reviews?kind=quizzes",
          undefined,
          "/admin",
        );
        assert.equal(review.status, 200);
        const attempt = review.data.items.find(
          (item: { id: string }) => item.id === attemptId,
        );
        assert.deepEqual(attempt?.questions, [
          {
            id: originalChoice.id,
            prompt: originalChoice.prompt,
            response: originalChoice.options[0],
          },
          {
            id: short.id,
            prompt: short.prompt,
            response: "Original written response",
          },
        ]);
        assert.equal(
          (
            await administrator.action("gradeQuiz", {
              id: attemptId,
              score: 85,
            })
          ).status,
          200,
        );
        const learnerState = await other.request("/state");
        const result = learnerState.data.attempts.find(
          (item: { id: string }) => item.id === attemptId,
        );
        assert.equal(result.score, 85);
        assert.equal(result.status, "graded");
        const refreshed = await administrator.request(
          "/reviews?kind=quizzes",
          undefined,
          "/admin",
        );
        assert.ok(
          !refreshed.data.items.some(
            (item: { id: string }) => item.id === attemptId,
          ),
        );
      },
    );
    await t.test(
      "assignment and pending quiz queues include older records on page two",
      async () => {
        const now = new Date("2090-01-01T00:00:00.000Z");
        const ids = Array.from(
          { length: 21 },
          (_, i) => `${courseId}-${String(i).padStart(2, "0")}`,
        );
        await db.learningRecord.createMany({
          data: ids.map((id) => ({
            id,
            userId: userIds[1],
            kind: "assignment",
            key: id,
            updatedAt: now,
            document: {
              content: "Pagination test",
              status: "submitted",
              created: now.toISOString(),
            },
          })),
        });
        await db.quizAttempt.createMany({
          data: ids.map((id) => ({
            id,
            userId: userIds[1],
            courseId,
            assessment: c.quiz,
            answers: {},
            status: "pending",
            submittedAt: now,
          })),
        });
        await db.quizAttempt.create({
          data: {
            id: `${courseId}-graded`,
            userId: userIds[1],
            courseId,
            assessment: c.quiz,
            answers: {},
            status: "graded",
            submittedAt: now,
          },
        });
        for (const kind of ["assignments", "quizzes"]) {
          const first = await administrator.request(
            `/reviews?kind=${kind}`,
            undefined,
            "/admin",
          );
          const second = await administrator.request(
            `/reviews?kind=${kind}&page=2`,
            undefined,
            "/admin",
          );
          assert.equal(first.status, 200);
          assert.equal(second.status, 200);
          assert.equal(first.data.total, second.data.total);
          assert.ok(second.data.total >= 21);
          assert.equal(first.data.pageSize, 20);
          assert.equal(second.data.page, 2);
          assert.deepEqual(
            first.data.items.map((item: { id: string }) => item.id),
            ids.slice(1).reverse(),
          );
          assert.equal(second.data.items[0].id, ids[0]);
        }
      },
    );
    await t.test(
      "deletion retains history and restoration creates a hidden draft",
      async () => {
        assert.equal(
          (await administrator.action("deleteCourse", { courseId })).status,
          200,
        );
        assert.ok(
          !(await learner.request("/state")).data.courses.some(
            (v: any) => v.id === courseId,
          ),
        );
        const v = await db.courseVersion.findFirstOrThrow({
          where: { courseId },
          orderBy: { createdAt: "desc" },
        });
        assert.equal(
          (await administrator.action("restore", { id: v.id })).status,
          200,
        );
        assert.equal(
          (await db.course.findUniqueOrThrow({ where: { id: courseId } }))
            .status,
          "draft",
        );
      },
    );
    await t.test(
      "deleting all draft content persists while publishing stays protected",
      async () => {
        const row = await db.course.findUniqueOrThrow({
          where: { id: courseId },
        });
        const empty = {
          ...(row.document as any),
          version: row.version,
          status: "draft",
          modules: [],
          quiz: { ...(row.document as any).quiz, questions: [] },
        };
        assert.equal(
          (await administrator.action("saveCourse", { course: empty })).status,
          200,
        );
        const stored = await db.course.findUniqueOrThrow({
          where: { id: courseId },
        });
        assert.equal((stored.document as any).modules.length, 0);
        assert.equal(
          (
            await administrator.action("saveCourse", {
              course: {
                ...empty,
                version: stored.version,
                status: "published",
              },
            })
          ).status,
          400,
        );
        const emptyModule = {
          ...empty,
          version: stored.version,
          modules: [
            { id: "empty-module", title: "An empty module", lessons: [] },
          ],
        };
        assert.equal(
          (await administrator.action("saveCourse", { course: emptyModule }))
            .status,
          200,
        );
        assert.equal(
          (
            await administrator.action("saveCourse", {
              course: {
                ...emptyModule,
                version: stored.version + 1,
                status: "published",
              },
            })
          ).status,
          400,
        );
      },
    );
  } finally {
    await db.academySetting.deleteMany({
      where: { id: { in: userIds.map((id) => "learning:user:" + id) } },
    });
    await db.courseVersion.deleteMany({ where: { courseId } });
    await db.course.deleteMany({ where: { id: courseId } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    await db.$disconnect();
  }
});
