import type { Course } from "./types";
export type RemovedContent =
  | { kind: "module"; index: number; module: Course["modules"][number] }
  | {
      kind: "lesson";
      moduleId: string;
      index: number;
      lesson: Course["modules"][number]["lessons"][number];
    };
export function deleteModule(course: Course, index: number) {
  const next = structuredClone(course);
  const [module] = next.modules.splice(index, 1);
  if (!module) throw new Error("Module not found.");
  return {
    course: next,
    removed: { kind: "module", index, module } as RemovedContent,
  };
}
export function deleteLesson(
  course: Course,
  moduleIndex: number,
  index: number,
) {
  const next = structuredClone(course),
    module = next.modules[moduleIndex];
  if (!module) throw new Error("Module not found.");
  const [lesson] = module.lessons.splice(index, 1);
  if (!lesson) throw new Error("Lesson not found.");
  return {
    course: next,
    removed: {
      kind: "lesson",
      moduleId: module.id,
      index,
      lesson,
    } as RemovedContent,
  };
}
export function restoreContent(course: Course, removed: RemovedContent) {
  const next = structuredClone(course);
  if (removed.kind === "module") {
    const index = Math.min(removed.index, next.modules.length);
    next.modules.splice(index, 0, structuredClone(removed.module));
    return { course: next, moduleIndex: index, lessonIndex: 0 };
  }
  const moduleIndex = next.modules.findIndex((m) => m.id === removed.moduleId);
  if (moduleIndex < 0)
    throw new Error("Add the module back before restoring its lesson.");
  const index = Math.min(
    removed.index,
    next.modules[moduleIndex].lessons.length,
  );
  next.modules[moduleIndex].lessons.splice(
    index,
    0,
    structuredClone(removed.lesson),
  );
  return { course: next, moduleIndex, lessonIndex: index };
}
