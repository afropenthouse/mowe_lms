import { z } from "zod";
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w-]+$/);
const link = z.union([
  z.literal(""),
  z.string().regex(/^\/api\/files\/[0-9a-f-]{36}$/i),
  z
    .url()
    .refine((v) => v.startsWith("https://"), "Use an HTTPS resource link."),
]);
const question = z
  .object({
    id,
    type: z.enum(["multiple", "boolean", "short"]),
    prompt: z.string().min(1).max(3000),
    options: z.array(z.string().min(1).max(1000)).max(10),
    answer: z.union([z.number().int(), z.string().max(3000)]),
    explanation: z.string().max(3000),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (
      q.type !== "short" &&
      (q.options.length < 2 ||
        typeof q.answer !== "number" ||
        q.answer < 0 ||
        q.answer >= q.options.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "Select a valid correct answer for every question.",
      });
    if (q.type === "boolean" && q.options.length !== 2)
      ctx.addIssue({
        code: "custom",
        message: "True/false questions need two options.",
      });
  });
export const courseSchema = z
  .object({
    id,
    title: z.string().trim().min(1).max(200),
    description: z.string().max(10000),
    order: z.number().int().min(0).max(1000),
    status: z.enum(["draft", "published"]),
    version: z.number().int().min(0),
    difficulty: z.enum(["Foundational", "Intermediate", "Advanced"]),
    instructor: z.string().min(1).max(200),
    modules: z
      .array(
        z
          .object({
            id,
            title: z.string().min(1).max(200),
            lessons: z
              .array(
                z
                  .object({
                    id,
                    title: z.string().min(1).max(200),
                    type: z.enum(["text", "video"]),
                    duration: z.number().int().min(1).max(600),
                    content: z.string().max(100000),
                    videoUrl: link,
                    resourceUrl: link,
                    placeholder: z.boolean(),
                  })
                  .strict(),
              )
              .max(100),
          })
          .strict(),
      )
      .max(100),
    quiz: z
      .object({
        passScore: z.number().int().min(1).max(100),
        attemptLimit: z.number().int().min(1).max(20),
        timeLimit: z.number().int().min(0).max(240),
        questions: z.array(question).max(100),
      })
      .strict(),
    assignment: z
      .object({ title: z.string().max(200), prompt: z.string().max(20000) })
      .strict(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.status === "published" && !c.quiz.questions.length)
      ctx.addIssue({
        code: "custom",
        message: "Add at least one quiz question before publishing.",
      });
    if (
      c.status === "published" &&
      (!c.modules.length || c.modules.some((m) => !m.lessons.length))
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Add at least one module and a lesson in each module before publishing.",
      });
    const ids = [
      ...c.modules.map((m) => m.id),
      ...c.modules.flatMap((m) => m.lessons.map((l) => l.id)),
      ...c.quiz.questions.map((q) => q.id),
    ];
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Modules, lessons and questions need unique IDs.",
      });
    if (
      c.status === "published" &&
      c.modules.some((m) =>
        m.lessons.some(
          (l) =>
            l.placeholder ||
            !l.content.trim() ||
            (l.type === "video" && !l.videoUrl),
        ),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Complete each lesson and mark it ready before publishing.",
      });
  });
export type CourseDocument = z.infer<typeof courseSchema>;
export const settingsSchema = z
  .object({
    price: z.number().min(0).max(100000000),
    currency: z.enum(["NGN", "USD", "GBP"]),
    enrollmentOpen: z.boolean(),
    programName: z.string().min(1).max(200),
    supportEmail: z.union([z.literal(""), z.email()]),
    certificateIssuer: z.string().min(1).max(200),
  })
  .strict();
