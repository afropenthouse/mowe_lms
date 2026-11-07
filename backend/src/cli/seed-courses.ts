import { db } from "../db.js";
import { curriculum } from "../content/curriculum.js";
import { courseSchema } from "../learning/validation.js";
import { installExpandedLessons } from "../content/install.js";
try {
  let created = 0;
  for (const value of curriculum) {
    const course = courseSchema.parse(value);
    const result = await db.course.createMany({
      data: [
        {
          id: course.id,
          title: course.title,
          status: course.status,
          position: course.order,
          version: 1,
          document: course,
        },
      ],
      skipDuplicates: true,
    });
    created += result.count;
  }
  const expanded = await installExpandedLessons();
  console.log(
    JSON.stringify({
      created,
      ...expanded,
      existingKept: curriculum.length - created,
      courses: await db.course.count({ where: { deletedAt: null } }),
    }),
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Course seeding failed.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
