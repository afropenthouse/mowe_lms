CREATE TABLE "mowe_lms"."lms_payments" (
  "reference" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "mowe_lms"."lms_auth_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "courseIds" TEXT[] NOT NULL,
  "amount" INTEGER NOT NULL CHECK ("amount" > 0),
  "mode" TEXT NOT NULL CHECK ("mode" IN ('test', 'live')),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'paid', 'failed')),
  "checkoutUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3)
);

CREATE INDEX "lms_payments_userId_mode_status_idx" ON "mowe_lms"."lms_payments" ("userId", "mode", "status");
CREATE INDEX "lms_payments_createdAt_idx" ON "mowe_lms"."lms_payments" ("createdAt");

UPDATE "mowe_lms"."lms_learning_records"
SET "document" = "document" || '{"paymentExempt": true}'::jsonb
WHERE "kind" = 'enroll' AND "key" = 'program';
