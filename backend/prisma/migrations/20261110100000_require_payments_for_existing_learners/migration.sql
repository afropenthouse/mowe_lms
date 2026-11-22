UPDATE "mowe_lms"."lms_learning_records"
SET "document" = "document" - 'paymentExempt'
WHERE "kind" = 'enroll' AND "key" = 'program' AND "document" ? 'paymentExempt';

INSERT INTO "mowe_lms"."lms_academy_settings" ("id", "document")
VALUES ('learning:content', '{"revision":"require-payments-for-existing-learners"}'::jsonb)
ON CONFLICT ("id") DO UPDATE SET "document" = EXCLUDED."document";
