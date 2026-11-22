import { lessons } from "./curriculum";
import type { Course, CourseAccess } from "./types";

// Older state responses include progress and grades without the course access map.
export function accessFromProgress(
  courses: Course[],
  completed: Set<string>,
  attempts: { course_id: string; status: string; score: number }[],
  submissions: { course_id: string; status: string }[],
  requireAssignments: boolean,
): Record<string, CourseAccess> {
  const access: Record<string, CourseAccess> = Object.create(null);
  let prerequisiteId: string | undefined;

  for (const course of courses) {
    if (prerequisiteId) {
      access[course.id] = { status: "locked", prerequisiteId };
      continue;
    }

    const entries = lessons(course);
    const unfinished = entries.find((lesson) => !completed.has(lesson.id));
    const passed = attempts.some(
      (attempt) =>
        attempt.course_id === course.id &&
        attempt.status === "graded" &&
        attempt.score >= Math.max(70, course.quiz.passScore),
    );
    const needsAssignment =
      requireAssignments &&
      Boolean(course.assignment.prompt.trim()) &&
      !submissions.some(
        (entry) => entry.course_id === course.id && entry.status === "graded",
      );
    if (entries.length && !unfinished && passed && !needsAssignment) {
      access[course.id] = { status: "completed" };
      continue;
    }

    access[course.id] = {
      status: "available",
      lessonId: unfinished?.id ?? entries.at(-1)?.id ?? "",
      activity: unfinished ? "lesson" : passed ? "assignment" : "assessment",
    };
    prerequisiteId = course.id;
  }
  return access;
}
