import "dotenv/config";
import { z } from "zod";
const parsed = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().url(),
    FRONTEND_URL: z.string().url(),
    AUTH_SECRET: z.string().min(64),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().default(465),
    SMTP_USER: z.string().email(),
    SMTP_PASS: z.string().min(1),
    MAIL_FROM: z.string().min(1),
    MAIL_DRIVER: z.enum(["smtp", "test"]).default("smtp"),
    TRUST_PROXY: z.enum(["0", "1"]).default("0"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  })
  .safeParse(process.env);
if (!parsed.success)
  throw new Error(
    `Invalid backend environment: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`,
  );
export const config = parsed.data;
if (
  config.NODE_ENV === "production" &&
  (config.MAIL_DRIVER !== "smtp" || !config.FRONTEND_URL.startsWith("https://"))
)
  throw Error("Production requires HTTPS and SMTP email delivery");
export const SESSION_COOKIE = "mowe_session";
export const CSRF_COOKIE = "mowe_csrf";
export const origin = new URL(config.FRONTEND_URL).origin;
