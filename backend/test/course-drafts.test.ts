import assert from "node:assert/strict";
import test from "node:test";
import { curriculum } from "../src/content/curriculum.js";
import { courseSchema } from "../src/learning/validation.js";
test("empty course structure and assessments can be saved as drafts but cannot be published", () => {
  const noModules = {
    ...structuredClone(curriculum[0]),
    status: "draft",
    modules: [],
  };
  assert.equal(courseSchema.safeParse(noModules).success, true);
  assert.equal(
    courseSchema.safeParse({ ...noModules, status: "published" }).success,
    false,
  );
  const noLessons = structuredClone(curriculum[0]);
  noLessons.modules[0].lessons = [];
  assert.equal(
    courseSchema.safeParse({ ...noLessons, status: "draft" }).success,
    true,
  );
  assert.equal(courseSchema.safeParse(noLessons).success, false);
  const noQuestions = structuredClone(curriculum[0]);
  noQuestions.quiz.questions = [];
  assert.equal(
    courseSchema.safeParse({ ...noQuestions, status: "draft" }).success,
    true,
  );
  assert.equal(courseSchema.safeParse(noQuestions).success, false);
});
