import { z } from "zod";
import { db } from "../db.js";

export const directoryQuery = z.object({
  search: z.string().trim().max(100).default(""),
  status: z.enum(["all", "active", "suspended", "pending"]).default("all"),
  enrollment: z.enum(["all", "enrolled", "not-enrolled"]).default("all"),
  page: z.coerce.number().int().min(1).max(1000000).default(1),
});
export type Learner = {
  id: string;
  name: string;
  email: string;
  studentNumber: string | null;
  createdAt: string;
  status: "active" | "suspended" | "pending";
  suspendedAt: string | null;
  suspensionReason: string;
  enrolledAt: string | null;
  completedLessons: number;
  quizAverage: number | null;
  gradedAttempts: number;
};
export type Directory = {
  learners: Learner[];
  total: number;
  page: number;
  pageSize: number;
  totalLessons: number;
};
export async function getLearners(
  input: z.infer<typeof directoryQuery>,
  paginate = true,
): Promise<Directory> {
  const pattern = "%" + input.search + "%",
    pageSize = 20;
  const [row] = await db.$queryRaw<{ directory: Directory }[]>`
    WITH active_courses AS (
      SELECT id,document FROM mowe_lms.lms_courses WHERE status='published' AND "deletedAt" IS NULL
    ), active_lessons AS (
      SELECT DISTINCT l->>'id' AS id FROM active_courses c
      CROSS JOIN LATERAL jsonb_array_elements(c.document->'modules') m
      CROSS JOIN LATERAL jsonb_array_elements(m->'lessons') l
    ), accounts AS (
      SELECT u.id,u.name,u.email,u."studentNumber",u."createdAt",u."suspendedAt",u."suspensionReason",u."emailVerifiedAt",
        CASE WHEN u."suspendedAt" IS NOT NULL THEN 'suspended' WHEN u."emailVerifiedAt" IS NULL THEN 'pending' ELSE 'active' END AS status,
        (SELECT r."updatedAt" FROM mowe_lms.lms_learning_records r WHERE r."userId"=u.id AND r.kind='enroll' AND r.key='program') AS "enrolledAt"
      FROM mowe_lms.lms_auth_users u WHERE u.role='STUDENT'
        AND (u.name ILIKE ${pattern} OR u.email ILIKE ${pattern} OR u."studentNumber" ILIKE ${pattern})
    ), matching AS (
      SELECT * FROM accounts a WHERE (${input.status}='all' OR a.status=${input.status})
        AND (${input.enrollment}='all' OR (${input.enrollment}='enrolled' AND a."enrolledAt" IS NOT NULL) OR (${input.enrollment}='not-enrolled' AND a."enrolledAt" IS NULL))
    ), page_users AS (
      SELECT * FROM matching ORDER BY "createdAt" DESC,id DESC LIMIT ${paginate ? pageSize : null} OFFSET ${paginate ? (input.page - 1) * pageSize : 0}
    ), details AS (
      SELECT p.id,p.name,p.email,p."studentNumber",p."createdAt",p.status,p."suspendedAt",p."suspensionReason",p."enrolledAt",
        CASE WHEN p."enrolledAt" IS NOT NULL AND p."emailVerifiedAt" IS NOT NULL THEN
          (SELECT count(*)::int FROM mowe_lms.lms_learning_records r JOIN active_lessons l ON l.id=r.key
            WHERE r."userId"=p.id AND r.kind='progress' AND r.document->>'completed' IN ('1','true')) ELSE 0 END AS "completedLessons",
        (SELECT round(avg(q.score))::int FROM mowe_lms.lms_quiz_attempts q WHERE q."userId"=p.id AND q.status='graded'
          AND (q."courseId"='program' OR q."courseId" IN (SELECT id FROM active_courses))) AS "quizAverage",
        (SELECT count(*)::int FROM mowe_lms.lms_quiz_attempts q WHERE q."userId"=p.id AND q.status='graded'
          AND (q."courseId"='program' OR q."courseId" IN (SELECT id FROM active_courses))) AS "gradedAttempts"
      FROM page_users p
    ) SELECT json_build_object('learners',coalesce((SELECT json_agg(d ORDER BY d."createdAt" DESC,d.id DESC) FROM details d),'[]'::json),
      'total',(SELECT count(*)::int FROM matching),'totalLessons',(SELECT count(*)::int FROM active_lessons),
      'page',${input.page}::int,'pageSize',${pageSize}::int) AS directory
  `;
  return row.directory;
}
export function learnersCsv(data: Directory) {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    return (
      '"' +
      (/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
      '"'
    );
  };
  const rows = data.learners.map((s) => [
    s.studentNumber,
    s.name,
    s.email,
    s.status,
    s.enrolledAt ? "Enrolled" : "Not enrolled",
    s.completedLessons,
    data.totalLessons,
    s.quizAverage ?? "",
  ]);
  return (
    "\uFEFF" +
    [
      [
        "Student number",
        "Name",
        "Email",
        "Account status",
        "Enrollment",
        "Completed lessons",
        "Total lessons",
        "Quiz average",
      ],
      ...rows,
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
