import type { Course } from "./types";
export const lessons = (course: Course) =>
  course.modules.flatMap((module) => module.lessons);
