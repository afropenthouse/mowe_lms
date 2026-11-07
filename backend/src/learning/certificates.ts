import { z } from "zod";
import { db } from "../db.js";
import { HttpError } from "../http.js";
import type { Prisma } from "../generated/prisma/client.js";

export const certificateSettingsSchema = z
  .object({
    enabled: z.boolean().default(true),
    programName: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .default("Certified Business Administrator"),
    issuer: z.string().trim().min(1).max(200).default("MOWE Academy"),
    signatoryName: z.string().trim().max(120).default(""),
    signatoryTitle: z.string().trim().max(120).default("Program Director"),
    requireAssignments: z.boolean().default(true),
    requireFinalAssessment: z.boolean().default(false),
  })
  .strict();
export async function certificateSettings(
  client: Prisma.TransactionClient = db,
) {
  const row = await client.academySetting.findUnique({
    where: { id: "certificates" },
  });
  return certificateSettingsSchema.parse(row?.document || {});
}
export const certificateQuery = z.object({
  search: z.string().trim().max(100).default(""),
  status: z.enum(["all", "eligible", "issued", "in-progress"]).default("all"),
  page: z.coerce.number().int().min(1).max(1000000).default(1),
});
export type CertificateLearner = {
  id: string;
  name: string;
  email: string;
  studentNumber: string | null;
  completedLessons: number;
  totalLessons: number;
  passedQuizzes: number;
  totalQuizzes: number;
  gradedAssignments: number;
  totalAssignments: number;
  finalPassed: boolean;
  eligible: boolean;
  status: "eligible" | "issued" | "in-progress";
  certificateId: string | null;
  issuedAt: string | null;
};
export type CertificateRegister = {
  learners: CertificateLearner[];
  total: number;
  page: number;
  pageSize: number;
  summary: { issued: number; eligible: number; inProgress: number };
};
export async function certificateRegister(
  input: z.infer<typeof certificateQuery>,
  client: Prisma.TransactionClient = db,
  userId: string | null = null,
): Promise<CertificateRegister> {
  const settings = await certificateSettings(client),
    pattern = `%${input.search}%`;
  const [row] = await client.$queryRaw<{ register: CertificateRegister }[]>`
    WITH courses AS (
      SELECT id,document FROM mowe_lms.lms_courses WHERE status='published' AND "deletedAt" IS NULL
    ), lessons AS (
      SELECT DISTINCT l->>'id' AS id FROM courses c
      CROSS JOIN LATERAL jsonb_array_elements(c.document->'modules') m
      CROSS JOIN LATERAL jsonb_array_elements(m->'lessons') l
    ), totals AS (
      SELECT (SELECT count(*)::int FROM lessons) AS lessons,
        (SELECT count(*)::int FROM courses) AS quizzes,
        (SELECT count(*)::int FROM courses WHERE length(trim(document->'assignment'->>'prompt'))>0) AS assignments
    ), details AS (
      SELECT u.id,u.name,u.email,u."studentNumber",t.lessons AS "totalLessons",t.quizzes AS "totalQuizzes",t.assignments AS "totalAssignments",
        u."emailVerifiedAt" IS NOT NULL AND u."suspendedAt" IS NULL AS active,
        (SELECT count(*)::int FROM mowe_lms.lms_learning_records r JOIN lessons l ON l.id=r.key
          WHERE r."userId"=u.id AND r.kind='progress' AND r.document->>'completed' IN ('1','true')) AS "completedLessons",
        (SELECT count(*)::int FROM courses c WHERE EXISTS (SELECT 1 FROM mowe_lms.lms_quiz_attempts q
          WHERE q."userId"=u.id AND q."courseId"=c.id AND q.status='graded' AND q.score>=(c.document->'quiz'->>'passScore')::int)) AS "passedQuizzes",
        (SELECT count(*)::int FROM courses c WHERE length(trim(c.document->'assignment'->>'prompt'))>0
          AND EXISTS (SELECT 1 FROM mowe_lms.lms_learning_records r WHERE r."userId"=u.id AND r.kind='assignment' AND r.key=c.id AND r.document->>'status'='graded')) AS "gradedAssignments",
        EXISTS (SELECT 1 FROM mowe_lms.lms_quiz_attempts q WHERE q."userId"=u.id AND q."courseId"='program' AND q.status='graded' AND q.score>=70) AS "finalPassed",
        cert.id AS "certificateId",cert.document->>'issuedAt' AS "issuedAt"
      FROM mowe_lms.lms_auth_users u CROSS JOIN totals t
      LEFT JOIN mowe_lms.lms_learning_records cert ON cert."userId"=u.id AND cert.kind='certificate' AND cert.key='program'
      WHERE u.role='STUDENT' AND (${userId}::text IS NULL OR u.id=${userId})
        AND (EXISTS (SELECT 1 FROM mowe_lms.lms_learning_records r WHERE r."userId"=u.id AND r.kind='enroll' AND r.key='program') OR cert.id IS NOT NULL)
    ), eligibility AS (
      SELECT *, (active AND "totalLessons">0 AND "totalQuizzes">0 AND "completedLessons"="totalLessons"
        AND "passedQuizzes"="totalQuizzes"
        AND (NOT ${settings.requireAssignments} OR "gradedAssignments"="totalAssignments")
        AND (NOT ${settings.requireFinalAssessment} OR "finalPassed")) AS eligible FROM details
    ), classified AS (
      SELECT *,CASE WHEN "certificateId" IS NOT NULL THEN 'issued' WHEN eligible THEN 'eligible' ELSE 'in-progress' END AS status FROM eligibility
    ), matching AS (
      SELECT * FROM classified WHERE (${input.status}='all' OR status=${input.status})
        AND (name ILIKE ${pattern} OR email ILIKE ${pattern} OR "studentNumber" ILIKE ${pattern})
    ), paged AS (
      SELECT * FROM matching ORDER BY "issuedAt" DESC NULLS LAST,name,id LIMIT 20 OFFSET ${(input.page - 1) * 20}
    ) SELECT json_build_object('learners',coalesce((SELECT json_agg(p) FROM paged p),'[]'::json),
      'total',(SELECT count(*)::int FROM matching),'page',${input.page}::int,'pageSize',20,
      'summary',json_build_object('issued',(SELECT count(*)::int FROM classified WHERE status='issued'),
        'eligible',(SELECT count(*)::int FROM classified WHERE status='eligible'),
        'inProgress',(SELECT count(*)::int FROM classified WHERE status='in-progress'))) AS register
  `;
  return row.register;
}
export async function issueCertificate(userId: string, issuedBy: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_users WHERE id=${userId} FOR UPDATE`;
    const existing = await tx.learningRecord.findUnique({
      where: {
        userId_kind_key: { userId, kind: "certificate", key: "program" },
      },
    });
    if (existing) return existing;
    const settings = await certificateSettings(tx);
    if (!settings.enabled)
      throw new HttpError(400, "Certificate issuance is currently paused.");
    const register = await certificateRegister(
      certificateQuery.parse({}),
      tx,
      userId,
    );
    const learner = register.learners[0];
    if (!learner?.eligible)
      throw new HttpError(
        400,
        "This learner has not met the certificate requirements. Complete all required lessons, quizzes and assessments first.",
      );
    const courses = await tx.course.findMany({
      where: { status: "published", deletedAt: null },
      select: { id: true, title: true },
      orderBy: { position: "asc" },
    });
    return tx.learningRecord.create({
      data: {
        userId,
        kind: "certificate",
        key: "program",
        document: {
          name: learner.name,
          studentNumber: learner.studentNumber,
          issuedAt: new Date().toISOString(),
          issuedBy,
          programName: settings.programName,
          issuer: settings.issuer,
          signatoryName: settings.signatoryName,
          signatoryTitle: settings.signatoryTitle,
          courses,
          fee: 0,
        },
      },
    });
  });
}
export function certificateView(row: { id: string; document: unknown }) {
  const { issuedBy: _private, ...document } = row.document as Record<
    string,
    unknown
  >;
  return { ...document, id: row.id, created: document.issuedAt };
}
