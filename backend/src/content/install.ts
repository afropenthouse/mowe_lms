import { db } from "../db.js";
import { curriculum } from "./curriculum.js";
import { courseSchema, type CourseDocument } from "../learning/validation.js";
import type { Prisma } from "../generated/prisma/client.js";
export function mergeExpandedLessons(
  current: CourseDocument,
  expanded: CourseDocument,
) {
  let added = 0;
  const modules = current.modules.map((module) => {
    const source = expanded.modules.find((m) => m.id === module.id);
    if (!source) return module;
    const ids = new Set(module.lessons.map((l) => l.id));
    const additions = source.lessons.filter(
      (l) => /-(case|workshop)$/.test(l.id) && !ids.has(l.id),
    );
    added += additions.length;
    return { ...module, lessons: [...module.lessons, ...additions] };
  });
  return {
    added,
    document: {
      ...current,
      modules,
      version: current.version + (added ? 1 : 0),
    },
  };
}
export async function installExpandedLessons() {
  let coursesUpdated = 0,
    lessonsAdded = 0;
  for (const source of curriculum) {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM mowe_lms.lms_courses WHERE id = ${source.id} FOR UPDATE`;
      const row = await tx.course.findUnique({ where: { id: source.id } });
      if (!row || row.deletedAt) return 0;
      const receiptId = "curriculum-expansion-2:" + source.id;
      if (await tx.academySetting.findUnique({ where: { id: receiptId } }))
        return 0;
      const merged = mergeExpandedLessons(
        row.document as unknown as CourseDocument,
        source,
      );
      if (merged.added) {
        const document = courseSchema.parse(merged.document);
        await tx.courseVersion.create({
          data: {
            courseId: row.id,
            document: row.document as Prisma.InputJsonValue,
          },
        });
        await tx.course.update({
          where: { id: row.id },
          data: { document, version: document.version },
        });
      }
      // Keep a receipt so later admin removals are respected on seed reruns.
      await tx.academySetting.create({
        data: {
          id: receiptId,
          document: { installed: new Date().toISOString() },
        },
      });
      return merged.added;
    });
    if (result) coursesUpdated++;
    lessonsAdded += result;
  }
  return { coursesUpdated, lessonsAdded };
}
