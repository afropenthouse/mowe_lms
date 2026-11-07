import type { CourseDocument } from "./validation.js";
export type Assessment = CourseDocument["quiz"];
export function withoutAnswers(course: CourseDocument): CourseDocument {
  return { ...course, quiz: publicAssessment(course.quiz) as Assessment };
}
export function publicAssessment(quiz: Assessment) {
  return {
    ...quiz,
    questions: quiz.questions.map(
      ({ answer: _answer, explanation: _explanation, ...q }) => q,
    ),
  };
}
export function gradeAssessment(
  quiz: Assessment,
  answers: Record<string, string | number>,
  expired: boolean,
) {
  const feedback = quiz.questions.map((q) => ({
    id: q.id,
    correct:
      !expired &&
      q.type !== "short" &&
      String(answers[q.id]) === String(q.answer),
    explanation:
      q.type === "short"
        ? "Your response will be reviewed by an instructor."
        : q.explanation,
  }));
  return {
    score: expired
      ? 0
      : Math.round(
          (feedback.filter((f) => f.correct).length / quiz.questions.length) *
            100,
        ),
    status:
      !expired && quiz.questions.some((q) => q.type === "short")
        ? "pending"
        : "graded",
    feedback,
    expired,
  };
}
