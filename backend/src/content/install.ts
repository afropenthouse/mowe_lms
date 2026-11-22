import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { db } from "../db.js";
import { curriculum, programCourseIds } from "./curriculum.js";
import { courseSchema, type CourseDocument } from "../learning/validation.js";

export function applyInteractiveCurriculum(
  source: CourseDocument,
  current?: CourseDocument,
) {
  const existingLessons = new Map(
    current?.modules.flatMap(({ lessons }) =>
      lessons.map((lesson) => [lesson.id, lesson]),
    ),
  );
  return courseSchema.parse({
    ...source,
    ...current,
    order: source.order,
    status: "published",
    modules: source.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        duration: existingLessons.get(lesson.id)?.duration ?? lesson.duration,
      })),
    })),
    quiz: current?.quiz.questions.length ? current.quiz : source.quiz,
    assignment: current?.assignment.prompt.trim()
      ? current.assignment
      : source.assignment,
  });
}

export async function installCurriculum() {
  const sources = curriculum.map((course) => courseSchema.parse(course));
  return db.$transaction(
    async (tx) => {
      // Serialize developer imports and coordinate with concurrent course edits.
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(39426, 1)`;
      const counts = { added: 0, updated: 0, fullProgramOrdersExtended: 0 };
      for (const source of sources) {
        await tx.$queryRaw`SELECT id FROM mowe_lms.lms_courses WHERE id = ${source.id} FOR UPDATE`;
        const row = await tx.course.findUnique({ where: { id: source.id } });
        const current = row?.document as CourseDocument | undefined;
        const course = applyInteractiveCurriculum(source, current);
        if (
          row &&
          !row.deletedAt &&
          row.status === course.status &&
          row.position === course.order &&
          isDeepStrictEqual(current, course)
        )
          continue;

        const version = row ? row.version + 1 : 1;
        const data = {
          title: course.title,
          status: course.status,
          position: course.order,
          version,
          document: { ...course, version },
        };
        if (row) {
          await tx.courseVersion.create({
            data: {
              courseId: row.id,
              document: row.document as CourseDocument,
            },
          });
          await tx.course.update({
            where: { id: source.id },
            data: { ...data, deletedAt: null },
          });
          counts.updated++;
        } else {
          await tx.course.create({ data: { id: source.id, ...data } });
          counts.added++;
        }
      }

      // Honor earlier full-program checkout orders at their original price.
      const extended = await tx.payment.updateMany({
        where: {
          title: "Full program",
          courseIds: { equals: programCourseIds.slice(0, 3) },
          status: { in: ["paid", "pending"] },
        },
        data: { courseIds: { set: programCourseIds } },
      });
      counts.fullProgramOrdersExtended = extended.count;
      if (counts.added || counts.updated || extended.count) {
        const id = "learning:content";
        const document = { revision: randomUUID() };
        await tx.academySetting.upsert({
          where: { id },
          create: { id, document },
          update: { document },
        });
      }
      return counts;
    },
    { timeout: 60_000 },
  );
}
