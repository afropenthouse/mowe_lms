import { Router, type Request } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { csrf, currentSession, requireSession, HttpError } from "../http.js";
import {
  courseSchema,
  settingsSchema,
  type CourseDocument,
} from "./validation.js";
import {
  gradeAssessment,
  publicAssessment,
  withoutAnswers,
  type Assessment,
} from "./assessment.js";
import { program } from "../content/curriculum.js";
import type { Prisma } from "../generated/prisma/client.js";
import { getOverview } from "./overview.js";
import { learningRevision, notifyLearningChange } from "./updates.js";
import { mediaList, fileView, validateCourseFiles } from "../files/service.js";
import { learnerNotifications } from "./announcements.js";
import { Prisma as PrismaValues } from "../generated/prisma/client.js";
import {
  certificateSettings,
  certificateView,
  issueCertificate,
} from "./certificates.js";
const json = (value: unknown) => value as Prisma.InputJsonValue;
const object = (value: unknown) => value as Record<string, any>;
const defaults = {
  price: 0,
  currency: "NGN",
  enrollmentOpen: true,
  programName: program.name,
  supportEmail: "",
  certificateIssuer: "MOWE Global",
};
async function admin(req: Request) {
  const session = await requireSession(req);
  if (session.user.role === "STUDENT")
    throw new HttpError(403, "Administrator access required.");
  return session;
}
async function published(id: string) {
  const row = await db.course.findFirst({
    where: { id, status: "published", deletedAt: null },
  });
  if (!row) throw new HttpError(404, "This course is not available.");
  return row.document as unknown as CourseDocument;
}
async function enrolled(userId: string) {
  const row = await db.learningRecord.findUnique({
    where: { userId_kind_key: { userId, kind: "enroll", key: "program" } },
  });
  if (!row)
    throw new HttpError(
      403,
      "Join the programme before starting this activity.",
    );
}
function attemptView(a: {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  score: number;
  startedAt: Date;
  submittedAt: Date | null;
  assessment: unknown;
}) {
  return {
    id: a.id,
    user_id: a.userId,
    course_id: a.courseId,
    status: a.status,
    score: a.score,
    started: a.startedAt.toISOString(),
    created: (a.submittedAt || a.startedAt).toISOString(),
    quiz: publicAssessment(a.assessment as Assessment),
  };
}
export const learning = Router();
learning.get("/notifications", async (req, res) => {
  const session = await requireSession(req);
  if (session.user.role !== "STUDENT")
    throw new HttpError(403, "Learner access required.");
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(1000000)
    .default(1)
    .parse(req.query.page);
  res.json(await learnerNotifications(session.userId, page));
});
learning.get("/certificates/:id", async (req, res) => {
  const row = await db.learningRecord.findFirst({
    where: { id: String(req.params.id), kind: "certificate", key: "program" },
  });
  if (!row)
    throw new HttpError(
      404,
      "Certificate not found. Check the certificate reference and try again.",
    );
  res.json({ certificate: certificateView(row) });
});
learning.get("/updates", async (req, res) => {
  const session = await currentSession(req);
  res.json({
    revision: await learningRevision(
      session?.userId,
      !!session && session.user.role !== "STUDENT",
    ),
  });
});
learning.get("/overview", async (req, res) => {
  await admin(req);
  res.json(await getOverview());
});
learning.get("/state", async (req, res) => {
  const session = await currentSession(req);
  const isAdmin = !!session && session.user.role !== "STUDENT";
  const [rows, setting, revision] = await Promise.all([
    db.course.findMany({
      where: { deletedAt: null, ...(isAdmin ? {} : { status: "published" }) },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    }),
    db.academySetting.findUnique({ where: { id: "program" } }),
    learningRevision(session?.userId, isAdmin),
  ]);
  const courses = rows.map((row) => {
    const c = row.document as unknown as CourseDocument;
    return isAdmin ? c : withoutAnswers(c);
  });
  const state: Record<string, any> = {
    revision,
    courses,
    program,
    settings: setting?.document || defaults,
    enrolled: false,
    progress: [],
    attempts: [],
    submissions: [],
    discussion: [],
    certificates: [],
    notificationUnread: 0,
    admin: {
      media: [],
    },
  };
  if (session) {
    const [records, attempts] = await Promise.all([
      db.learningRecord.findMany({
        where: {
          userId: session.userId,
          kind: { notIn: ["comment", "notification"] },
        },
      }),
      db.quizAttempt.findMany({
        where: { userId: session.userId },
        orderBy: { startedAt: "asc" },
      }),
    ]);
    state.enrolled = records.some((r) => r.kind === "enroll");
    if (!isAdmin)
      state.notificationUnread = await db.learningRecord.count({
        where: {
          userId: session.userId,
          kind: "notification",
          document: { path: ["readAt"], equals: PrismaValues.JsonNull },
        },
      });
    state.certificates = records
      .filter((r) => r.kind === "certificate")
      .map(certificateView);
    state.certificateSettings = await certificateSettings();
    state.saved = records
      .filter((r) => r.kind === "bookmark")
      .map((r) => r.key);
    const validLessons = new Set(
      rows
        .filter((r) => r.status === "published")
        .flatMap((r) =>
          (r.document as unknown as CourseDocument).modules.flatMap((m) =>
            m.lessons.map((l) => l.id),
          ),
        ),
    );
    state.progress = records
      .filter((r) => r.kind === "progress" && validLessons.has(r.key))
      .map((r) => ({
        ...object(r.document),
        user_id: r.userId,
        lesson_id: r.key,
      }));
    state.submissions = records
      .filter((r) => r.kind === "assignment")
      .map((r) => ({ ...object(r.document), id: r.id, user_id: r.userId }));
    const attachmentIds = state.submissions
      .map((s: any) => s.file)
      .filter((id: unknown) => typeof id === "string");
    if (attachmentIds.length) {
      const attachments = await db.fileAsset.findMany({
        where: { id: { in: attachmentIds } },
      });
      state.submissions = state.submissions.map((s: any) => ({
        ...s,
        attachment: attachments.find((a) => a.id === s.file)
          ? fileView(attachments.find((a) => a.id === s.file)!)
          : null,
      }));
    }
    state.attempts = attempts.map((a) => attemptView(a));
    const comments = await db.learningRecord.findMany({
      where: { kind: "comment" },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    state.discussion = comments.map((r) => ({
      ...object(r.document),
      id: r.id,
    }));
  }
  if (isAdmin) {
    const [overview, media] = await Promise.all([getOverview(), mediaList()]);
    state.admin = {
      media: media.files,
      mediaCursor: media.nextCursor,
      overview,
    };
  }
  res.json(state);
});
learning.use(csrf);
learning.patch("/notifications/read", async (req, res) => {
  const session = await requireSession(req);
  if (session.user.role !== "STUDENT")
    throw new HttpError(403, "Learner access required.");
  const { id } = z
    .object({ id: z.string().uuid().optional() })
    .strict()
    .parse(req.body);
  const readAt = new Date().toISOString();
  const changed =
    await db.$executeRaw`UPDATE mowe_lms.lms_learning_records SET document=jsonb_set(document,'{readAt}',to_jsonb(${readAt}::text))
    WHERE "userId"=${session.userId} AND kind='notification' AND (${id || null}::text IS NULL OR key=${id || null}) AND document->>'readAt' IS NULL`;
  if (id && !changed) {
    const own = await db.learningRecord.findUnique({
      where: {
        userId_kind_key: {
          userId: session.userId,
          kind: "notification",
          key: id,
        },
      },
    });
    if (!own) throw new HttpError(404, "Notification not found.");
  }
  await notifyLearningChange(session.userId);
  res.json({ ok: true });
});
learning.post("/actions", async (req, res) => {
  const session = await requireSession(req);
  const { action, payload: p } = z
    .object({
      action: z.string().max(40),
      payload: z.record(z.string(), z.unknown()).default({}),
    })
    .strict()
    .parse(req.body);
  const userId = session.userId;
  let affectedUser = userId;
  const now = new Date().toISOString();
  async function record(kind: string, key: string, document: unknown) {
    return db.learningRecord.upsert({
      where: { userId_kind_key: { userId, kind, key } },
      create: { userId, kind, key, document: json(document) },
      update: { document: json(document) },
    });
  }
  if (
    [
      "saveCourse",
      "deleteCourse",
      "restore",
      "settings",
      "grade",
      "gradeQuiz",
    ].includes(action)
  )
    await admin(req);
  if (action === "saveCourse") {
    const c = courseSchema.parse(p.course);
    await validateCourseFiles(c);
    await db.$transaction(async (tx) => {
      const old = await tx.course.findUnique({ where: { id: c.id } });
      if (!old) {
        if (c.version !== 0)
          throw new HttpError(
            409,
            "This course was removed. Reload before editing.",
          );
        const next = { ...c, version: 1 };
        await tx.course.create({
          data: {
            id: c.id,
            title: c.title,
            status: c.status,
            position: c.order,
            version: 1,
            document: json(next),
          },
        });
      } else {
        const next = { ...c, version: c.version + 1 };
        const changed = await tx.course.updateMany({
          where: { id: c.id, version: c.version, deletedAt: null },
          data: {
            title: c.title,
            status: c.status,
            position: c.order,
            version: next.version,
            document: json(next),
          },
        });
        if (!changed.count)
          throw new HttpError(
            409,
            "Another administrator changed this course. Reload before saving.",
          );
        await tx.courseVersion.create({
          data: { courseId: c.id, document: json(old.document) },
        });
      }
    });
  } else if (action === "deleteCourse") {
    const { courseId } = z.object({ courseId: z.string().min(1) }).parse(p);
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM mowe_lms.lms_courses WHERE id = ${courseId} FOR UPDATE`;
      const row = await tx.course.findUnique({ where: { id: courseId } });
      if (!row || row.deletedAt) throw new HttpError(404, "Course not found.");
      await tx.courseVersion.create({
        data: { courseId, document: json(row.document) },
      });
      await tx.course.update({
        where: { id: courseId },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });
    });
  } else if (action === "restore") {
    const { id } = z.object({ id: z.string().min(1) }).parse(p);
    await db.$transaction(async (tx) => {
      const saved = await tx.courseVersion.findUnique({ where: { id } });
      if (!saved) throw new HttpError(404, "Saved version not found.");
      await tx.$queryRaw`SELECT id FROM mowe_lms.lms_courses WHERE id = ${saved.courseId} FOR UPDATE`;
      const current = await tx.course.findUnique({
        where: { id: saved.courseId },
      });
      if (!current) throw new HttpError(404, "Course not found.");
      const c = courseSchema.parse({
        ...object(saved.document),
        status: "draft",
        version: current.version + 1,
      });
      await validateCourseFiles(c, tx);
      await tx.courseVersion.create({
        data: { courseId: c.id, document: json(current.document) },
      });
      await tx.course.update({
        where: { id: c.id },
        data: {
          document: json(c),
          title: c.title,
          position: c.order,
          status: "draft",
          deletedAt: null,
          version: c.version,
        },
      });
    });
  } else if (action === "settings") {
    const value = settingsSchema.parse(p.settings);
    await db.academySetting.upsert({
      where: { id: "program" },
      create: { id: "program", document: value },
      update: { document: value },
    });
  } else if (action === "enroll") {
    const settings = await db.academySetting.findUnique({
      where: { id: "program" },
    });
    if (settings && object(settings.document).enrollmentOpen === false)
      throw new HttpError(403, "Enrollment is currently closed.");
    if (settings && Number(object(settings.document).price) > 0)
      throw new HttpError(
        409,
        "Paid enrollment will be available when checkout is configured.",
      );
    await record("enroll", "program", { created: now });
  } else if (action === "bookmark") {
    const input = z
      .object({ courseId: z.string(), saved: z.boolean() })
      .strict()
      .parse(p);
    await published(input.courseId);
    if (input.saved) await record("bookmark", input.courseId, { saved: true });
    else
      await db.learningRecord.deleteMany({
        where: { userId, kind: "bookmark", key: input.courseId },
      });
  } else if (action === "progress") {
    await enrolled(userId);
    const input = z
      .object({
        lessonId: z.string(),
        completed: z.boolean().optional(),
        note: z.string().max(20000).optional(),
        seconds: z.number().int().min(0).max(86400).optional(),
      })
      .strict()
      .parse(p);
    const courses = await db.course.findMany({
      where: { status: "published", deletedAt: null },
    });
    const lesson = courses
      .flatMap((c) =>
        (c.document as unknown as CourseDocument).modules.flatMap(
          (m) => m.lessons,
        ),
      )
      .find((l) => l.id === input.lessonId);
    if (!lesson || lesson.placeholder)
      throw new HttpError(400, "This lesson is not ready.");
    const previous = await db.learningRecord.findUnique({
      where: {
        userId_kind_key: { userId, kind: "progress", key: input.lessonId },
      },
    });
    const old = previous ? object(previous.document) : {};
    await record("progress", input.lessonId, {
      completed: input.completed || old.completed ? 1 : 0,
      note: input.note ?? old.note ?? "",
      seconds: input.seconds ?? old.seconds ?? 0,
      updated: now,
    });
  } else if (action === "quizStart") {
    await enrolled(userId);
    const { courseId } = z.object({ courseId: z.string() }).parse(p);
    let quiz: Assessment;
    if (courseId === "program") {
      const courses = await db.course.findMany({
        where: { status: "published", deletedAt: null },
        orderBy: { position: "asc" },
      });
      if (!courses.length)
        throw new HttpError(400, "No assessments are available.");
      quiz = {
        passScore: 70,
        attemptLimit: 3,
        timeLimit: 30,
        questions: courses.flatMap(
          (c) => (c.document as unknown as CourseDocument).quiz.questions,
        ),
      };
    } else quiz = (await published(courseId)).quiz;
    const attempt = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_users WHERE id = ${userId} FOR UPDATE`;
      const attempts = await tx.quizAttempt.findMany({
        where: { userId, courseId },
        orderBy: { startedAt: "desc" },
      });
      const active = attempts.find((a) => a.status === "started");
      if (active) return active;
      if (attempts.length >= quiz.attemptLimit)
        throw new HttpError(
          400,
          "You have reached the assessment attempt limit.",
        );
      return tx.quizAttempt.create({
        data: { userId, courseId, assessment: json(quiz) },
      });
    });
    await notifyLearningChange(userId);
    res.json({
      attemptId: attempt.id,
      started: attempt.startedAt.toISOString(),
      quiz: publicAssessment(attempt.assessment as Assessment),
    });
    return;
  } else if (action === "quizSubmit") {
    const input = z
      .object({
        attemptId: z.string(),
        answers: z
          .record(
            z.string().max(100),
            z.union([z.string().max(5000), z.number().int().min(0).max(9)]),
          )
          .refine((a) => Object.keys(a).length <= 1000),
      })
      .strict()
      .parse(p);
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM mowe_lms.lms_quiz_attempts WHERE id = ${input.attemptId} FOR UPDATE`;
      const a = await tx.quizAttempt.findUnique({
        where: { id: input.attemptId },
      });
      if (!a || a.userId !== userId)
        throw new HttpError(404, "Assessment not found.");
      if (a.status !== "started")
        throw new HttpError(409, "This assessment was already submitted.");
      const quiz = a.assessment as Assessment;
      const expired =
        quiz.timeLimit > 0 &&
        Date.now() > a.startedAt.getTime() + quiz.timeLimit * 60000;
      const grade = gradeAssessment(quiz, input.answers, expired);
      await tx.quizAttempt.update({
        where: { id: a.id },
        data: {
          answers: input.answers,
          feedback: json(grade.feedback),
          score: grade.score,
          status: grade.status,
          submittedAt: new Date(),
        },
      });
      return grade;
    });
    await notifyLearningChange(userId);
    res.json(result);
    return;
  } else if (action === "assignment") {
    await enrolled(userId);
    const input = z
      .object({
        courseId: z.string(),
        content: z.string().trim().max(50000).default(""),
        file: z.string().uuid().nullable().optional(),
      })
      .strict()
      .parse(p);
    await published(input.courseId);
    if (input.content.length < 20 && !input.file)
      throw new HttpError(
        400,
        "Write at least 20 characters or attach your assignment.",
      );
    if (input.file) {
      const attachment = await db.fileAsset.findFirst({
        where: {
          id: input.file,
          ownerId: userId,
          purpose: "assignment",
          courseId: input.courseId,
        },
      });
      if (!attachment)
        throw new HttpError(
          403,
          "Choose an assignment file you uploaded for this course.",
        );
    }
    await record("assignment", input.courseId, {
      course_id: input.courseId,
      name: session.user.name,
      content: input.content,
      file: input.file || null,
      status: "submitted",
      feedback: "",
      created: now,
    });
  } else if (action === "grade") {
    const input = z
      .object({
        id: z.string(),
        status: z.enum(["graded", "revision"]),
        feedback: z.string().max(10000),
        expectedUpdatedAt: z.iso.datetime().optional(),
      })
      .strict()
      .parse(p);
    const old = await db.learningRecord.findFirst({
      where: { id: input.id, kind: "assignment" },
    });
    if (!old) throw new HttpError(404, "Submission not found.");
    if (
      input.expectedUpdatedAt &&
      input.expectedUpdatedAt !== old.updatedAt.toISOString()
    )
      throw new HttpError(
        409,
        "This submission changed. Review the latest version before grading.",
      );
    affectedUser = old.userId;
    const changed = await db.learningRecord.updateMany({
      where: {
        id: old.id,
        updatedAt: old.updatedAt,
      },
      data: {
        document: json({
          ...object(old.document),
          status: input.status,
          feedback: input.feedback,
        }),
      },
    });
    if (!changed.count)
      throw new HttpError(
        409,
        "This submission changed. Review the latest version before grading.",
      );
  } else if (action === "gradeQuiz") {
    const input = z
      .object({ id: z.string(), score: z.number().int().min(0).max(100) })
      .strict()
      .parse(p);
    const target = await db.quizAttempt.findUnique({ where: { id: input.id } });
    if (target) affectedUser = target.userId;
    const changed = await db.quizAttempt.updateMany({
      where: { id: input.id, status: "pending" },
      data: { score: input.score, status: "graded" },
    });
    if (!changed.count)
      throw new HttpError(404, "Pending assessment not found.");
  } else if (action === "comment") {
    await enrolled(userId);
    const input = z
      .object({
        courseId: z.string(),
        content: z.string().trim().min(1).max(3000),
      })
      .strict()
      .parse(p);
    await published(input.courseId);
    await record("comment", crypto.randomUUID(), {
      course_id: input.courseId,
      name: session.user.name,
      body: input.content,
      created: now,
    });
  } else if (action === "certificate") {
    if (session.user.role !== "STUDENT")
      throw new HttpError(403, "Only learners can claim a certificate.");
    await issueCertificate(userId, userId);
  } else throw new HttpError(400, "Unknown learning action.");
  await notifyLearningChange(
    affectedUser,
    ["saveCourse", "deleteCourse", "restore", "settings", "comment"].includes(
      action,
    ),
  );
  res.json({ ok: true });
});
