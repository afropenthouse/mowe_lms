import { db } from "../db.js";
import { HttpError } from "../http.js";
import type { Prisma } from "../generated/prisma/client.js";
import { certificateSettings } from "./certificates.js";
import { withoutAnswers } from "./assessment.js";
import type { CourseDocument } from "./validation.js";
import { paidCourses } from "../payments/access.js";
import { programCourseIds } from "../content/curriculum.js";
import { config } from "../config.js";

const coreOrder = new Map(programCourseIds.map((id, i) => [id, i]));
const coreRank = (id: string) => coreOrder.get(id) ?? coreOrder.size;

export function orderedCourses<T extends { id: string }>(courses: T[]) {
  return [...courses].sort((a, b) => coreRank(a.id) - coreRank(b.id));
}

export async function publishedCourses(client: Prisma.TransactionClient = db) {
  const rows = await client.course.findMany({
    where: { status: "published", deletedAt: null },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { document: true },
  });
  return orderedCourses(
    rows.map(({ document }) => document as unknown as CourseDocument),
  );
}

export const courseLessons = (course: CourseDocument) =>
  course.modules.flatMap((module) => module.lessons);

type CourseAccess =
  | { status: "locked"; prerequisiteId: string }
  | { status: "payment_required" }
  | { status: "completed" }
  | {
      status: "available";
      lessonId: string;
      activity: "lesson" | "assessment" | "assignment";
    };

export function courseProgression(
  courses: CourseDocument[],
  records: { kind: string; key: string; document: unknown }[],
  attempts: { courseId: string; status: string; score: number }[],
  requireAssignments: boolean,
  paid?: Set<string>,
  openAccess = config.OPEN_COURSE_ACCESS,
) {
  const completedLessons = new Set<string>();
  const gradedAssignments = new Set<string>();
  const quizScores = new Map<string, number>();
  for (const record of records) {
    const document = record.document as {
      completed?: unknown;
      status?: string;
    };
    if (
      record.kind === "progress" &&
      (document?.completed === 1 || document?.completed === true)
    )
      completedLessons.add(record.key);
    if (record.kind === "assignment" && document?.status === "graded")
      gradedAssignments.add(record.key);
  }
  for (const attempt of attempts) {
    if (attempt.status === "graded")
      quizScores.set(
        attempt.courseId,
        Math.max(quizScores.get(attempt.courseId) ?? -1, attempt.score),
      );
  }

  const access: Record<string, CourseAccess> = Object.create(null);
  let prerequisiteId: string | undefined;
  for (const course of courses) {
    if (!openAccess && prerequisiteId) {
      access[course.id] = { status: "locked", prerequisiteId };
      continue;
    }
    if (!openAccess && paid && !paid.has(course.id)) {
      access[course.id] = { status: "payment_required" };
      prerequisiteId = course.id;
      continue;
    }
    const lessons = courseLessons(course);
    const unfinished = lessons.find(
      (lesson) => !completedLessons.has(lesson.id),
    );
    const needsQuiz =
      (quizScores.get(course.id) ?? -1) < Math.max(70, course.quiz.passScore);
    const needsAssignment =
      requireAssignments &&
      course.assignment.prompt.trim() &&
      !gradedAssignments.has(course.id);
    if (lessons.length && !unfinished && !needsQuiz && !needsAssignment) {
      access[course.id] = { status: "completed" };
    } else {
      access[course.id] = {
        status: "available",
        lessonId: unfinished?.id ?? lessons.at(-1)?.id ?? "",
        activity: unfinished
          ? "lesson"
          : needsQuiz
            ? "assessment"
            : "assignment",
      };
      prerequisiteId = course.id;
    }
  }
  return access;
}

type Actor = { userId: string; user: { role: string } };

export async function requireCourseAccess(
  actor: Actor,
  courseIds: string[],
  courses: CourseDocument[],
  client: Prisma.TransactionClient = db,
) {
  const records = await client.learningRecord.findMany({
    where: {
      userId: actor.userId,
      kind: { in: ["enroll", "progress", "assignment"] },
    },
    select: { kind: true, key: true, document: true },
  });
  const enrollment = records.find(
    ({ kind, key }) => kind === "enroll" && key === "program",
  );
  if (!enrollment)
    throw new HttpError(403, "Join the program before starting this activity.");
  if (actor.user.role !== "STUDENT") return;

  const [attempts, settings, paid] = await Promise.all([
    client.quizAttempt.findMany({
      where: { userId: actor.userId, status: "graded" },
      select: { courseId: true, status: true, score: true },
    }),
    certificateSettings(client),
    paidCourses(actor.userId, client),
  ]);
  const access = courseProgression(
    courses,
    records,
    attempts,
    settings.requireAssignments,
    paid,
  );
  const program = courseIds.includes("program");
  if (
    program
      ? courses.length &&
        courses.every(({ id }) => access[id].status === "completed")
      : courseIds.some(
          (id) =>
            access[id]?.status === "available" ||
            access[id]?.status === "completed",
        )
  )
    return;

  if (program && config.OPEN_COURSE_ACCESS)
    throw new HttpError(
      403,
      "Complete all courses before taking the program assessment.",
    );

  const blocker = courses.find(
    ({ id }) =>
      access[id].status === "available" ||
      access[id].status === "payment_required",
  );
  if (blocker && access[blocker.id].status === "payment_required")
    throw new HttpError(
      403,
      `Pay for ${blocker.title} to continue.`,
      "PAYMENT_REQUIRED",
    );
  throw new HttpError(
    403,
    blocker
      ? `Complete ${blocker.title} before moving on. Each course unlocks the next.`
      : "This course is not available.",
  );
}

export function courseForLearner(
  course: CourseDocument,
  canStudy: boolean,
): CourseDocument & { questionCount: number; hasAssignment: boolean } {
  const questionCount = course.quiz.questions.length;
  const hasAssignment = Boolean(course.assignment.prompt.trim());
  if (canStudy)
    return { ...withoutAnswers(course), questionCount, hasAssignment };

  const firstLesson = courseLessons(course)[0];
  const sample =
    (firstLesson?.embedUrl ? "" : firstLesson?.content || "")
      .split(/\r?\n\s*\r?\n/)
      .find(
        (paragraph) =>
          paragraph.trim() && !paragraph.trimStart().startsWith("#"),
      )
      ?.trim() || "";
  return {
    ...course,
    questionCount,
    hasAssignment,
    modules: course.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map(({ embedUrl: _embedUrl, ...lesson }) => ({
        ...lesson,
        content: lesson.id === firstLesson?.id ? sample.slice(0, 500) : "",
        videoUrl: "",
        resourceUrl: "",
      })),
    })),
    quiz: { ...course.quiz, questions: [] },
    assignment: { ...course.assignment, prompt: "" },
  };
}
