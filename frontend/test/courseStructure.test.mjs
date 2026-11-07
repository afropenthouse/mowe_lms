import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteModule,
  deleteLesson,
  restoreContent,
} from "../src/lib/courseStructure.ts";
const fixture = () => ({
  id: "draft",
  title: "A draft",
  modules: [
    {
      id: "m1",
      title: "First module",
      lessons: [
        { id: "l1", title: "First lesson", content: "Original content" },
      ],
    },
    {
      id: "m2",
      title: "Second module",
      lessons: [{ id: "l2", title: "Second lesson", content: "Other content" }],
    },
  ],
});
test("the last module can be removed and restored without changing the original", () => {
  const original = fixture();
  original.modules = original.modules.slice(0, 1);
  const result = deleteModule(original, 0);
  assert.equal(result.course.modules.length, 0);
  assert.equal(original.modules.length, 1);
  assert.deepEqual(
    restoreContent(result.course, result.removed).course,
    original,
  );
});
test("the last lesson can be removed while keeping its module", () => {
  const original = fixture(),
    result = deleteLesson(original, 0, 0);
  assert.equal(result.course.modules[0].lessons.length, 0);
  assert.equal(result.course.modules[0].id, "m1");
  assert.deepEqual(
    restoreContent(result.course, result.removed).course,
    original,
  );
});
test("undo restores content without discarding later edits", () => {
  const result = deleteLesson(fixture(), 0, 0);
  result.course.title = "An edited title";
  result.course.modules[1].title = "A renamed module";
  const restored = restoreContent(result.course, result.removed);
  assert.equal(restored.course.title, "An edited title");
  assert.equal(restored.course.modules[1].title, "A renamed module");
  assert.equal(
    restored.course.modules[0].lessons[0].content,
    "Original content",
  );
  assert.equal(restored.moduleIndex, 0);
  assert.equal(restored.lessonIndex, 0);
});
