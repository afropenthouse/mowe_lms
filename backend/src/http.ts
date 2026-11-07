import type { Request, Response, NextFunction } from "express";
import { config, CSRF_COOKIE, origin, SESSION_COOKIE } from "./config.js";
import { equal, protectedDigest, token, digest } from "./auth/crypto.js";
import { db } from "./db.js";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export function issueCsrf(res: Response) {
  const value = token();
  res.cookie(CSRF_COOKIE, `${value}.${protectedDigest(`csrf:${value}`)}`, {
    ...cookieOptions,
    maxAge: 3600000,
  });
  return value;
}
export function csrf(req: Request, _res: Response, next: NextFunction) {
  const value = req.get("x-csrf-token") || "";
  const signed = String(req.cookies?.[CSRF_COOKIE] || "");
  const [cookie, signature] = signed.split(".");
  if (
    !value ||
    !cookie ||
    !signature ||
    !equal(value, cookie) ||
    !equal(signature, protectedDigest(`csrf:${cookie}`))
  )
    throw new HttpError(
      403,
      "Your security token expired. Please try again.",
      "CSRF_INVALID",
    );
  const requestOrigin = req.get("origin");
  if (requestOrigin && requestOrigin !== origin)
    throw new HttpError(403, "This request is not allowed.");
  next();
}
export async function currentSession(req: Request) {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (typeof raw !== "string" || !/^[a-f0-9]{64}$/.test(raw)) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digest(raw) },
    include: { user: true },
  });
  if (
    !session ||
    session.expiresAt < new Date() ||
    !session.user.emailVerifiedAt ||
    session.user.suspendedAt
  )
    return null;
  return session;
}
export async function requireSession(req: Request) {
  const session = await currentSession(req);
  if (!session)
    throw new HttpError(401, "Please sign in to continue.", "UNAUTHENTICATED");
  return session;
}
export function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerifiedAt: Date | null;
  bio: string;
  linkedinUrl: string;
  photoUrl: string;
  studentNumber?: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentNumber: user.studentNumber || null,
    role: user.role === "STUDENT" ? "student" : "admin",
    isSuperAdmin: user.role === "SUPERADMIN",
    emailVerified: !!user.emailVerifiedAt,
    profile: {
      bio: user.bio,
      linkedin: user.linkedinUrl,
      photo: user.photoUrl,
    },
  };
}
