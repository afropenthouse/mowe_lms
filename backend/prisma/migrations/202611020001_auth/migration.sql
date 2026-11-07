-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "mowe_lms";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "ChallengePurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- CreateTable
CREATE TABLE "lms_auth_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "bio" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_auth_sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_auth_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "ChallengePurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_auth_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_auth_invitations" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_auth_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_auth_rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_auth_rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "lms_auth_users_email_key" ON "lms_auth_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lms_auth_sessions_tokenHash_key" ON "lms_auth_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "lms_auth_sessions_userId_idx" ON "lms_auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "lms_auth_sessions_expiresAt_idx" ON "lms_auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "lms_auth_challenges_expiresAt_idx" ON "lms_auth_challenges"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "lms_auth_challenges_userId_purpose_key" ON "lms_auth_challenges"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "lms_auth_invitations_tokenHash_key" ON "lms_auth_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "lms_auth_invitations_email_idx" ON "lms_auth_invitations"("email");

-- CreateIndex
CREATE INDEX "lms_auth_invitations_expiresAt_idx" ON "lms_auth_invitations"("expiresAt");

-- CreateIndex
CREATE INDEX "lms_auth_rate_limits_expiresAt_idx" ON "lms_auth_rate_limits"("expiresAt");

-- AddForeignKey
ALTER TABLE "lms_auth_sessions" ADD CONSTRAINT "lms_auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lms_auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_auth_challenges" ADD CONSTRAINT "lms_auth_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lms_auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

