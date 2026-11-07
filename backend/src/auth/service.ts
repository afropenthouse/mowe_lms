import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { config } from "../config.js";
import { HttpError } from "../http.js";
import {
  digest,
  equal,
  hashPassword,
  protectedDigest,
  token,
  verificationCode,
  verifyPassword,
} from "./crypto.js";
import { sendCode, sendMail, mailTemplate } from "../mail.js";
import type { ChallengePurpose } from "../generated/prisma/enums.js";

const minutes = (n: number) => new Date(Date.now() + n * 60000);
const generic = "If this email is eligible, a verification code has been sent.";
function requirePortal(role: string, portal?: "learner" | "admin") {
  const accountPortal = role === "STUDENT" ? "learner" : "admin";
  if (portal && portal !== accountPortal) {
    throw new HttpError(
      403,
      accountPortal === "admin"
        ? "Use administrator sign-in for this account."
        : "Use learner sign-in for this account.",
      "WRONG_PORTAL",
    );
  }
}
export async function register(input: {
  email: string;
  name: string;
  password: string;
  role: "student" | "admin";
  inviteToken?: string;
}) {
  const passwordHash = await hashPassword(input.password);
  const code = verificationCode();
  const challengeId = randomUUID();
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`register:${input.email}`}))`;
    await tx.$queryRaw`SELECT a.id FROM mowe_lms.lms_auth_challenges a JOIN mowe_lms.lms_auth_users u ON u.id=a."userId" WHERE u.email=${input.email} ORDER BY a.id FOR UPDATE OF a`;
    await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_users WHERE email=${input.email} FOR UPDATE`;
    const existing = await tx.user.findUnique({
      where: { email: input.email },
    });
    if (existing?.emailVerifiedAt || existing?.suspendedAt)
      return { deliver: false, challengeId: randomUUID() };
    let role: "STUDENT" | "ADMIN" = "STUDENT";
    if (input.role === "admin") {
      const invitation = input.inviteToken
        ? await tx.adminInvitation.findUnique({
            where: { tokenHash: digest(input.inviteToken) },
          })
        : null;
      if (
        !invitation ||
        invitation.email !== input.email ||
        invitation.consumedAt ||
        invitation.expiresAt < new Date()
      )
        throw new HttpError(
          403,
          "A valid invitation for this email is required to create an administrator account.",
          "INVITATION_REQUIRED",
        );
      const used = await tx.adminInvitation.updateMany({
        where: {
          id: invitation.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (!used.count)
        throw new HttpError(403, "This invitation has already been used.");
      role = "ADMIN";
    }
    if (existing?.role !== "STUDENT" && existing)
      throw new HttpError(
        409,
        "An administrator registration is pending. Sign in with that registration and verify your email.",
      );
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { name: input.name, passwordHash, role },
        })
      : await tx.user.create({
          data: { email: input.email, name: input.name, passwordHash, role },
        });
    await tx.authChallenge.upsert({
      where: { userId_purpose: { userId: user.id, purpose: "VERIFY_EMAIL" } },
      create: {
        id: challengeId,
        userId: user.id,
        purpose: "VERIFY_EMAIL",
        codeHash: protectedDigest(`${challengeId}:${code}`),
        expiresAt: minutes(10),
      },
      update: {
        id: challengeId,
        codeHash: protectedDigest(`${challengeId}:${code}`),
        expiresAt: minutes(10),
        attempts: 0,
        consumedAt: null,
        sentAt: new Date(),
      },
    });
    return { deliver: true, challengeId };
  });
  if (result.deliver) await deliver(input.email, code, "VERIFY_EMAIL");
  return {
    message: generic,
    challengeId: result.challengeId,
    email: input.email,
  };
}
async function deliver(email: string, code: string, purpose: string) {
  try {
    await sendCode(email, code, purpose);
  } catch {
    throw new HttpError(
      503,
      "Email delivery is temporarily unavailable. Please try again shortly.",
      "MAIL_UNAVAILABLE",
    );
  }
}
export async function requestReset(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.emailVerifiedAt || user.suspendedAt)
    return { message: generic, challengeId: randomUUID() };
  const code = verificationCode(),
    id = randomUUID();
  await db.authChallenge.upsert({
    where: { userId_purpose: { userId: user.id, purpose: "RESET_PASSWORD" } },
    create: {
      id,
      userId: user.id,
      purpose: "RESET_PASSWORD",
      codeHash: protectedDigest(`${id}:${code}`),
      expiresAt: minutes(10),
    },
    update: {
      id,
      codeHash: protectedDigest(`${id}:${code}`),
      expiresAt: minutes(10),
      attempts: 0,
      consumedAt: null,
      sentAt: new Date(),
    },
  });
  await deliver(email, code, "RESET_PASSWORD");
  return { message: generic, challengeId: id };
}
export async function resend(challengeId: string) {
  const code = verificationCode();
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "mowe_lms"."lms_auth_challenges" WHERE id=${challengeId} FOR UPDATE`;
    const challenge = await tx.authChallenge.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });
    if (!challenge || challenge.consumedAt || challenge.user.suspendedAt)
      return null;
    if (Date.now() - challenge.sentAt.getTime() < 60000)
      throw new HttpError(
        429,
        "Please wait 60 seconds before requesting another code.",
        "RESEND_COOLDOWN",
      );
    await tx.authChallenge.update({
      where: { id: challengeId },
      data: {
        codeHash: protectedDigest(`${challengeId}:${code}`),
        attempts: 0,
        expiresAt: minutes(10),
        sentAt: new Date(),
      },
    });
    return { email: challenge.user.email, purpose: challenge.purpose };
  });
  if (result) await deliver(result.email, code, result.purpose);
  return { message: generic, challengeId };
}
export async function completeChallenge(
  id: string,
  code: string,
  purpose: ChallengePurpose,
  newPassword?: string,
  portal?: "learner" | "admin",
) {
  const passwordHash = newPassword
    ? await hashPassword(newPassword)
    : undefined;
  const sessionToken = token();
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "mowe_lms"."lms_auth_challenges" WHERE id=${id} FOR UPDATE`;
    const challenge = await tx.authChallenge.findUnique({ where: { id } });
    if (
      !challenge ||
      challenge.purpose !== purpose ||
      challenge.consumedAt ||
      challenge.expiresAt < new Date() ||
      challenge.attempts >= 5
    )
      return { ok: false as const };
    if (!equal(challenge.codeHash, protectedDigest(`${id}:${code}`))) {
      await tx.authChallenge.update({
        where: { id },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false as const };
    }
    await tx.$queryRaw`SELECT id FROM "mowe_lms"."lms_auth_users" WHERE id=${challenge.userId} FOR UPDATE`;
    const account = await tx.user.findUniqueOrThrow({
      where: { id: challenge.userId },
      select: { suspendedAt: true, role: true },
    });
    if (account.suspendedAt) return { ok: false as const };
    if (purpose === "VERIFY_EMAIL") requirePortal(account.role, portal);
    await tx.authChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
    if (purpose === "RESET_PASSWORD") {
      if (!passwordHash)
        throw new HttpError(400, "A new password is required.");
      await tx.user.update({
        where: { id: challenge.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      });
      await tx.session.deleteMany({ where: { userId: challenge.userId } });
      await tx.authChallenge.updateMany({
        where: { userId: challenge.userId, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      return { ok: true as const, user: null };
    }
    const user = await tx.user.update({
      where: { id: challenge.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await tx.session.create({
      data: {
        userId: user.id,
        tokenHash: digest(sessionToken),
        expiresAt: minutes(60 * 24 * 7),
      },
    });
    return { ok: true as const, user };
  });
  if (!result.ok)
    throw new HttpError(
      400,
      "This code is invalid, expired, or has reached its attempt limit. Request a new code.",
      "INVALID_CODE",
    );
  return { user: result.user, sessionToken };
}
let dummyHashPromise: Promise<string> | undefined;
export async function login(
  email: string,
  password: string,
  remember: boolean,
  portal?: "learner" | "admin",
) {
  const user = await db.user.findUnique({ where: { email } });
  dummyHashPromise ??= hashPassword(token());
  const valid = await verifyPassword(
    password,
    user?.passwordHash || (await dummyHashPromise),
  );
  if (!user || !valid)
    throw new HttpError(
      401,
      "The email or password is incorrect.",
      "INVALID_CREDENTIALS",
    );
  if (user.suspendedAt)
    throw new HttpError(
      403,
      user.role === "STUDENT"
        ? "Your account is suspended. Contact the academy administrator."
        : "Your administrator access has been removed. Contact the Super Admin.",
      "ACCOUNT_SUSPENDED",
    );
  requirePortal(user.role, portal);
  if (!user.emailVerifiedAt) {
    let challenge = await db.authChallenge.findUnique({
      where: { userId_purpose: { userId: user.id, purpose: "VERIFY_EMAIL" } },
    });
    if (!challenge || challenge.consumedAt) {
      const id = randomUUID(),
        code = verificationCode();
      const verification = {
        id,
        userId: user.id,
        purpose: "VERIFY_EMAIL" as const,
        codeHash: protectedDigest(`${id}:${code}`),
        expiresAt: minutes(10),
      };
      challenge = await db.authChallenge.upsert({
        where: { userId_purpose: { userId: user.id, purpose: "VERIFY_EMAIL" } },
        create: verification,
        update: {
          ...verification,
          attempts: 0,
          consumedAt: null,
          sentAt: new Date(),
        },
      });
      await deliver(email, code, "VERIFY_EMAIL");
    } else if (Date.now() - challenge.sentAt.getTime() >= 60000) {
      await resend(challenge.id);
    }
    throw Object.assign(
      new HttpError(
        403,
        "Verify your email before signing in.",
        "EMAIL_UNVERIFIED",
      ),
      { challengeId: challenge.id },
    );
  }
  const raw = token();
  const expiresAt = minutes(60 * 24 * (remember ? 30 : 7));
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "mowe_lms"."lms_auth_users" WHERE id=${user.id} FOR UPDATE`;
    const current = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
    if (current.suspendedAt)
      throw new HttpError(
        403,
        current.role === "STUDENT"
          ? "Your account is suspended. Contact the academy administrator."
          : "Your administrator access has been removed. Contact the Super Admin.",
        "ACCOUNT_SUSPENDED",
      );
    if (current.passwordHash !== user.passwordHash)
      throw new HttpError(
        401,
        "Your credentials changed. Please sign in again.",
      );
    await tx.session.create({
      data: { userId: user.id, tokenHash: digest(raw), expiresAt },
    });
    const extra = await tx.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: 10,
      select: { id: true },
    });
    if (extra.length)
      await tx.session.deleteMany({
        where: { id: { in: extra.map((s) => s.id) } },
      });
  });
  return { user, token: raw, expiresAt };
}
export async function inviteAdmin(email: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt)
    throw new HttpError(
      409,
      "This email already has an account. Invite an unregistered email address.",
    );
  const raw = token();
  const invite = await db.adminInvitation.create({
    data: { email, tokenHash: digest(raw), expiresAt: minutes(60 * 24 * 7) },
  });
  const link = `${config.FRONTEND_URL}/admin/signup?invite=${raw}&email=${encodeURIComponent(email)}`;
  try {
    await sendMail({
      to: email,
      subject: "Your administrator invitation from MOWE Academy",
      text: `You have been invited to manage MOWE Academy. Create your administrator account using this private link: ${link}\nThis invitation expires in 7 days.`,
      html: mailTemplate(
        "Your academy invitation",
        `<p>You have been invited to create an administrator account.</p><p><a style="display:inline-block;padding:14px 22px;border-radius:24px;background:#c8281b;color:white;text-decoration:none" href="${link.replaceAll("&", "&amp;")}">Create administrator account</a></p><p>Your private invitation expires in 7 days and can be used once.</p>`,
      ),
    });
  } catch {
    await db.adminInvitation.delete({ where: { id: invite.id } });
    throw new HttpError(
      503,
      "The invitation could not be delivered. Please try again.",
    );
  }
  return { message: "Administrator invitation sent. It expires in 7 days." };
}
