import { config } from "../config.js";
import type { Request } from "express";
import { db } from "../db.js";
import { protectedDigest } from "./crypto.js";
import { HttpError } from "../http.js";
export async function limit(
  scope: string,
  identity: string,
  max: number,
  windowSeconds: number,
) {
  const key = protectedDigest(
    `${config.NODE_ENV === "test" ? "test:" + process.pid + ":" : ""}${scope}:${identity}`,
  );
  const expires = new Date(Date.now() + windowSeconds * 1000);
  const result = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "mowe_lms"."lms_auth_rate_limits" (key,count,"expiresAt") VALUES (${key},1,${expires}) ON CONFLICT (key) DO UPDATE SET count=CASE WHEN "mowe_lms"."lms_auth_rate_limits"."expiresAt" < NOW() THEN 1 ELSE "mowe_lms"."lms_auth_rate_limits".count+1 END,"expiresAt"=CASE WHEN "mowe_lms"."lms_auth_rate_limits"."expiresAt" < NOW() THEN ${expires} ELSE "mowe_lms"."lms_auth_rate_limits"."expiresAt" END RETURNING count`;
  if (result[0].count > max)
    throw new HttpError(
      429,
      "Too many requests. Please wait and try again.",
      "RATE_LIMITED",
    );
}
export async function limitRequest(
  req: Request,
  scope: string,
  email?: string,
) {
  await limit(scope, req.ip || "unknown", scope === "login" ? 30 : 20, 900);
  if (email)
    await limit(`${scope}:email`, email, scope === "login" ? 10 : 5, 900);
}
