import { z } from "zod";
import { db } from "../db.js";
import { fileView } from "../files/service.js";
import type { Assessment } from "../learning/assessment.js";

export const reviewQuery = z.object({
  kind: z.enum(["assignments", "quizzes"]),
  page: z.coerce.number().int().min(1).max(1000000).default(1),
});

const pageSize = 20;

async function courseTitles(courseIds: string[]) {
  const ids = [...new Set(courseIds)].filter((id) => id !== "program");
  const courses = ids.length
    ? await db.course.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true },
      })
    : [];
  const titles = new Map(courses.map(({ id, title }) => [id, title]));
  return (id: string) =>
    id === "program"
      ? "Program final assessment"
      : titles.get(id) || "Course unavailable";
}

function responseText(
  question: Assessment["questions"][number],
  value: unknown,
) {
  if (question.type === "short") {
    return typeof value === "string" && value.trim() ? value : null;
  }
  if (
    typeof value === "number" ||
    (typeof value === "string" && /^[0-9]$/.test(value))
  ) {
    return question.options[Number(value)] ?? null;
  }
  return null;
}

export async function getReviewPage({
  kind,
  page,
}: z.infer<typeof reviewQuery>) {
  const pagination = { skip: (page - 1) * pageSize, take: pageSize };

  if (kind === "quizzes") {
    const where = { status: "pending" };
    const [rows, total] = await Promise.all([
      db.quizAttempt.findMany({
        where,
        ...pagination,
        orderBy: [
          { submittedAt: { sort: "desc", nulls: "last" } },
          { id: "desc" },
        ],
        include: { user: { select: { name: true } } },
      }),
      db.quizAttempt.count({ where }),
    ]);
    const titleFor = await courseTitles(rows.map((row) => row.courseId));
    const items = rows.map((row) => {
      const snapshot = row.assessment as Assessment;
      const answers = row.answers as Record<string, unknown> | null;
      return {
        id: row.id,
        learnerName: row.user.name,
        courseTitle: titleFor(row.courseId),
        submittedAt: (row.submittedAt ?? row.startedAt).toISOString(),
        questions: snapshot.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          response: responseText(question, answers?.[question.id]),
        })),
      };
    });
    return { kind, items, page, pageSize, total };
  }

  const where = { kind: "assignment" };
  const [rows, total] = await Promise.all([
    db.learningRecord.findMany({
      where,
      ...pagination,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: { user: { select: { name: true } } },
    }),
    db.learningRecord.count({ where }),
  ]);
  const documents = rows.map(
    ({ document }) =>
      document as {
        content?: string;
        file?: string | null;
        status?: string;
        feedback?: string;
        created?: string;
      },
  );
  const fileIds = documents.flatMap(({ file }) => (file ? [file] : []));
  const [titleFor, attachments] = await Promise.all([
    courseTitles(rows.map((row) => row.key)),
    fileIds.length
      ? db.fileAsset.findMany({
          where: { id: { in: fileIds }, purpose: "assignment" },
        })
      : [],
  ]);
  const files = new Map(attachments.map((file) => [file.id, file]));
  const items = rows.map((row, index) => {
    const document = documents[index];
    const asset = document.file ? files.get(document.file) : undefined;
    const attachment =
      asset?.ownerId === row.userId && asset.courseId === row.key
        ? fileView(asset)
        : null;
    return {
      id: row.id,
      learnerName: row.user.name,
      courseTitle: titleFor(row.key),
      submittedAt: document.created || row.updatedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      status: document.status || "submitted",
      content: document.content || "",
      feedback: document.feedback || "",
      hasAttachment: Boolean(document.file),
      attachment,
    };
  });
  return { kind, items, page, pageSize, total };
}
