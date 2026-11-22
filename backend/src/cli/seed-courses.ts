import { db } from "../db.js";
import { installCurriculum } from "../content/install.js";

try {
  console.log(JSON.stringify(await installCurriculum()));
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Course seeding failed.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
