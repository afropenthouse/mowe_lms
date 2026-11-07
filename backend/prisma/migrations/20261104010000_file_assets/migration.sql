CREATE TABLE "mowe_lms"."lms_file_assets" (
  "id" TEXT PRIMARY KEY, "ownerId" TEXT, "publicId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL, "deliveryType" TEXT NOT NULL, "format" TEXT NOT NULL DEFAULT '',
  "secureUrl" TEXT NOT NULL, "name" TEXT NOT NULL, "mime" TEXT NOT NULL,
  "size" INTEGER NOT NULL, "purpose" TEXT NOT NULL, "courseId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lms_file_assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "mowe_lms"."lms_auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "lms_file_assets_publicId_key" ON "mowe_lms"."lms_file_assets"("publicId");
CREATE INDEX "lms_file_assets_ownerId_purpose_idx" ON "mowe_lms"."lms_file_assets"("ownerId","purpose");
CREATE INDEX "lms_file_assets_purpose_createdAt_idx" ON "mowe_lms"."lms_file_assets"("purpose","createdAt");
