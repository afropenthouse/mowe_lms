import { Router } from "express";
import { z } from "zod";
import { newPasswordSchema as password } from "./validation.js";
import {
  csrf,
  currentSession,
  HttpError,
  issueCsrf,
  publicUser,
  requireSession,
  cookieOptions,
} from "../http.js";
import { SESSION_COOKIE } from "../config.js";
import { db } from "../db.js";
import { digest, hashPassword, verifyPassword, token } from "./crypto.js";
import { limitRequest, limit } from "./rate-limit.js";
import { notifyLearningChange } from "../learning/updates.js";
import {
  completeChallenge,
  inviteAdmin,
  login,
  register,
  requestReset,
  resend,
} from "./service.js";
const email = z.string().trim().toLowerCase().email().max(254);
const challenge = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
});
export const auth = Router();
auth.get("/csrf", (_req, res) => {
  res.json({ csrfToken: issueCsrf(res) });
});
auth.get("/me", async (req, res) => {
  const session = await currentSession(req);
  res.json({ user: session ? publicUser(session.user) : null });
});
auth.get("/admin/users", async (req, res) => {
  const session = await requireSession(req);
  if (session.user.role !== "SUPERADMIN")
    throw new HttpError(403, "Super Admin access required.");
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const users = await db.user.findMany({
    take: 51,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: "desc" },
    select: {
      id: true,
      email: true,
      studentNumber: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
  res.json({
    users: users.slice(0, 50),
    nextCursor: users.length > 50 ? users[49].id : null,
  });
});
auth.use(csrf);
auth.post("/register", async (req, res) => {
  const input = z
    .object({
      email,
      name: z.string().trim().min(2).max(100),
      password,
      role: z.enum(["student", "admin"]).default("student"),
      inviteToken: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
    })
    .strict()
    .parse(req.body);
  await limitRequest(req, "register", input.email);
  res.status(201).json(await register(input));
});
auth.post("/login", async (req, res) => {
  const input = z
    .object({
      email,
      password: z.string().min(1).max(128),
      remember: z.boolean().default(false),
      portal: z.enum(["learner", "admin"]).optional(),
    })
    .strict()
    .parse(req.body);
  await limitRequest(req, "login", input.email);
  const result = await login(
    input.email,
    input.password,
    input.remember,
    input.portal,
  );
  res.cookie(SESSION_COOKIE, result.token, {
    ...cookieOptions,
    expires: result.expiresAt,
  });
  res.json({ user: publicUser(result.user) });
});
auth.post("/verify-email", async (req, res) => {
  const input = challenge
    .extend({ portal: z.enum(["learner", "admin"]).optional() })
    .strict()
    .parse(req.body);
  await limitRequest(req, "verify", input.challengeId);
  const result = await completeChallenge(
    input.challengeId,
    input.code,
    "VERIFY_EMAIL",
    undefined,
    input.portal,
  );
  res.cookie(SESSION_COOKIE, result.sessionToken, {
    ...cookieOptions,
    maxAge: 7 * 86400000,
  });
  res.json({ user: publicUser(result.user!) });
});
auth.post("/resend-code", async (req, res) => {
  const { challengeId } = z
    .object({ challengeId: z.string().uuid() })
    .strict()
    .parse(req.body);
  await limitRequest(req, "resend", challengeId);
  res.json(await resend(challengeId));
});
auth.post("/forgot-password", async (req, res) => {
  const input = z.object({ email }).strict().parse(req.body);
  await limitRequest(req, "forgot", input.email);
  res.json(await requestReset(input.email));
});
auth.post("/reset-password", async (req, res) => {
  const input = challenge.extend({ password }).strict().parse(req.body);
  await limitRequest(req, "reset", input.challengeId);
  await completeChallenge(
    input.challengeId,
    input.code,
    "RESET_PASSWORD",
    input.password,
  );
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.json({
    message: "Your password is updated. Sign in with your new password.",
  });
});
auth.post("/logout", async (req, res) => {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (typeof raw === "string")
    await db.session.deleteMany({ where: { tokenHash: digest(raw) } });
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.json({ ok: true });
});
auth.post("/logout-all", async (req, res) => {
  const session = await requireSession(req);
  await db.session.deleteMany({ where: { userId: session.userId } });
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.json({ ok: true });
});
auth.patch("/profile", async (req, res) => {
  const session = await requireSession(req);
  const url = z.union([
    z.literal(""),
    z
      .string()
      .url()
      .refine((v) => v.startsWith("https://"), "Use an HTTPS link."),
  ]);
  const input = z
    .object({
      name: z.string().trim().min(2).max(100),
      bio: z.string().max(1000).default(""),
      linkedin: url.default(""),
      photo: url.default(""),
    })
    .strict()
    .parse(req.body);
  const user = await db.user.update({
    where: { id: session.userId },
    data: {
      name: input.name,
      bio: input.bio,
      linkedinUrl: input.linkedin,
      photoUrl: input.photo,
    },
  });
  await notifyLearningChange(session.userId);
  res.json({ user: publicUser(user) });
});

auth.post("/change-password", async (req, res) => {
  const session = await requireSession(req);
  const input = z
    .object({
      currentPassword: z.string().min(1).max(128),
      newPassword: password,
      confirmPassword: password,
    })
    .strict()
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    })
    .parse(req.body);
  await limit("change-password", session.userId, 10, 900);
  if (!(await verifyPassword(input.currentPassword, session.user.passwordHash)))
    throw new HttpError(400, "Your current password is incorrect.");
  if (input.currentPassword === input.newPassword)
    throw new HttpError(400, "Choose a different password.");
  const passwordHash = await hashPassword(input.newPassword),
    raw = token();
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "mowe_lms"."lms_auth_challenges" WHERE "userId"=${session.userId} AND purpose='RESET_PASSWORD' FOR UPDATE`;
    const changed = await tx.user.updateMany({
      where: { id: session.userId, passwordHash: session.user.passwordHash },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    if (!changed.count)
      throw new HttpError(
        409,
        "Your password changed in another session. Sign in again.",
      );
    const renewed = await tx.session.updateMany({
      where: {
        id: session.id,
        tokenHash: session.tokenHash,
        expiresAt: { gt: new Date() },
      },
      data: { tokenHash: digest(raw) },
    });
    if (!renewed.count)
      throw new HttpError(401, "Your session expired. Sign in again.");
    await tx.session.deleteMany({
      where: { userId: session.userId, id: { not: session.id } },
    });
    await tx.authChallenge.updateMany({
      where: {
        userId: session.userId,
        purpose: "RESET_PASSWORD",
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });
  });
  res.cookie(SESSION_COOKIE, raw, {
    ...cookieOptions,
    expires: session.expiresAt,
  });
  res.json({
    message: "Password updated. Your other sessions have been signed out.",
  });
});
auth.post("/admin-invitations", async (req, res) => {
  const session = await requireSession(req);
  if (session.user.role !== "SUPERADMIN")
    throw new HttpError(403, "Only the Super Admin can invite administrators.");
  const input = z.object({ email }).strict().parse(req.body);
  await limitRequest(req, "invitation", session.userId);
  const result = await inviteAdmin(input.email);
  await notifyLearningChange(session.userId);
  res.status(201).json(result);
});
