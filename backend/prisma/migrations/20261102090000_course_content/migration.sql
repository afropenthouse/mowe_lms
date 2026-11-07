CREATE TABLE "mowe_lms"."lms_courses" (
  "id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "status" TEXT NOT NULL,
  "position" INTEGER NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "document" JSONB NOT NULL, "deletedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "lms_courses_status_position_idx" ON "mowe_lms"."lms_courses"("status", "position");
CREATE TABLE "mowe_lms"."lms_course_versions" (
  "id" TEXT PRIMARY KEY, "courseId" TEXT NOT NULL, "document" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "lms_course_versions_courseId_createdAt_idx" ON "mowe_lms"."lms_course_versions"("courseId", "createdAt");
CREATE TABLE "mowe_lms"."lms_learning_records" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "kind" TEXT NOT NULL,
  "key" TEXT NOT NULL, "document" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lms_learning_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mowe_lms"."lms_auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "lms_learning_records_userId_kind_key_key" ON "mowe_lms"."lms_learning_records"("userId", "kind", "key");
CREATE INDEX "lms_learning_records_kind_idx" ON "mowe_lms"."lms_learning_records"("kind");
CREATE TABLE "mowe_lms"."lms_quiz_attempts" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "courseId" TEXT NOT NULL,
  "assessment" JSONB NOT NULL, "answers" JSONB, "feedback" JSONB, "score" INTEGER NOT NULL DEFAULT -1,
  "status" TEXT NOT NULL DEFAULT 'started', "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submittedAt" TIMESTAMP(3),
  CONSTRAINT "lms_quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mowe_lms"."lms_auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "lms_quiz_attempts_userId_courseId_idx" ON "mowe_lms"."lms_quiz_attempts"("userId", "courseId");
CREATE TABLE "mowe_lms"."lms_academy_settings" ("id" TEXT PRIMARY KEY DEFAULT 'program', "document" JSONB NOT NULL);
