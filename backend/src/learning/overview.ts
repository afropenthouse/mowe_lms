import { db } from "../db.js";
export type Overview = {
  enrolledLearners: number;
  publishedCourses: number;
  completedLessons: number;
  pendingReviews: number;
  courseProgress: {
    id: string;
    title: string;
    lessonCount: number;
    completed: number;
    possible: number;
    percent: number;
  }[];
  generatedAt: string;
};
export async function getOverview(): Promise<Overview> {
  const [row] = await db.$queryRaw<{ overview: Overview }[]>`
    WITH active_courses AS (
      SELECT id, title, position, status, document FROM mowe_lms.lms_courses WHERE "deletedAt" IS NULL
    ), course_lessons AS (
      SELECT c.id AS course_id, l->>'id' AS lesson_id
      FROM active_courses c
      CROSS JOIN LATERAL jsonb_array_elements(c.document->'modules') m
      CROSS JOIN LATERAL jsonb_array_elements(m->'lessons') l
      WHERE c.status = 'published'
    ), enrolled_students AS (
      SELECT u.id FROM mowe_lms.lms_auth_users u
      WHERE u.role = 'STUDENT' AND u."emailVerifiedAt" IS NOT NULL
        AND EXISTS (SELECT 1 FROM mowe_lms.lms_learning_records r WHERE r."userId"=u.id AND r.kind='enroll' AND r.key='program')
    ), valid_progress AS (
      SELECT DISTINCT r."userId", l.course_id, l.lesson_id
      FROM mowe_lms.lms_learning_records r
      JOIN enrolled_students s ON s.id=r."userId"
      JOIN course_lessons l ON l.lesson_id=r.key
      WHERE r.kind='progress' AND r.document->>'completed' IN ('1','true')
    ), per_course AS (
      SELECT c.id, c.title, c.position, (SELECT count(*)::int FROM course_lessons l WHERE l.course_id=c.id) AS lessons,
        (SELECT count(*)::int FROM valid_progress p WHERE p.course_id=c.id) AS completed,
        (SELECT count(*)::int FROM enrolled_students) AS learners
      FROM active_courses c WHERE c.status='published'
    )
    SELECT json_build_object(
      'enrolledLearners',(SELECT count(*)::int FROM enrolled_students),
      'publishedCourses',(SELECT count(*)::int FROM active_courses WHERE status='published'),
      'completedLessons',(SELECT count(*)::int FROM valid_progress),
      'pendingReviews',
        (SELECT count(*)::int FROM mowe_lms.lms_learning_records r JOIN enrolled_students s ON s.id=r."userId"
          JOIN active_courses c ON c.id=r.key WHERE r.kind='assignment' AND r.document->>'status'='submitted')
        + (SELECT count(*)::int FROM mowe_lms.lms_quiz_attempts q JOIN enrolled_students s ON s.id=q."userId"
          WHERE q.status='pending' AND (q."courseId"='program' OR EXISTS(SELECT 1 FROM active_courses c WHERE c.id=q."courseId"))),
      'courseProgress',COALESCE((SELECT json_agg(json_build_object(
        'id',p.id,'title',p.title,'lessonCount',p.lessons,'completed',p.completed,'possible',p.lessons*p.learners,
        'percent',CASE WHEN p.lessons*p.learners=0 THEN 0 ELSE LEAST(100,ROUND(100.0*p.completed/(p.lessons*p.learners))) END
      ) ORDER BY p.position,p.id) FROM per_course p),'[]'::json),
      'generatedAt',CURRENT_TIMESTAMP
    ) AS overview
  `;
  return row.overview;
}
