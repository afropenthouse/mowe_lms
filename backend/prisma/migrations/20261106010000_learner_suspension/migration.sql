ALTER TABLE "mowe_lms"."lms_auth_users"
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ADD COLUMN "suspensionReason" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "suspendedById" TEXT;
