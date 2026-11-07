import type { CourseDocument } from "../learning/validation.js";
export function lesson(
  title: string,
  objective: string,
  teaching: string,
  example: string,
  activity: string,
  takeaway: string,
  resourceUrl = "",
) {
  return {
    title,
    type: "text" as const,
    duration: 20,
    content: `## What you will learn\n\n${objective}\n\n${teaching.trim()}\n\n## Workplace example\n\n${example}\n\n## Practice and reflection\n\n${activity}\n\n## Key takeaway\n\n${takeaway}`,
    videoUrl: "",
    resourceUrl,
    placeholder: false,
  };
}
type LessonInput = ReturnType<typeof lesson>;
export type QuestionInput = [
  prompt: string,
  correct: string,
  distractor1: string,
  distractor2: string,
  distractor3: string,
  explanation: string,
];
export function course(
  n: number,
  title: string,
  description: string,
  lessons: LessonInput[],
  questions: QuestionInput[],
  assignmentTitle: string,
  assignmentPrompt: string,
): CourseDocument {
  return {
    id: `course-${n}`,
    title,
    description,
    order: n - 1,
    status: "published",
    version: 1,
    difficulty: "Foundational",
    instructor: "MOWE Academy",
    modules: lessons.map((l, i) => ({
      id: `c${n}-m${i + 1}`,
      title: l.title,
      lessons: [{ ...l, id: `c${n}-l${i + 1}` }],
    })),
    quiz: {
      passScore: 70,
      attemptLimit: 3,
      timeLimit: 0,
      questions: questions.map(([prompt, correct, ...rest], i) => {
        const explanation = rest.pop()!;
        const options = [...rest];
        const answer = (i + n) % 4;
        options.splice(answer, 0, correct);
        return {
          id: `c${n}-q${i + 1}`,
          type: "multiple",
          prompt,
          options,
          answer,
          explanation,
        };
      }),
    },
    assignment: { title: assignmentTitle, prompt: assignmentPrompt },
  };
}
