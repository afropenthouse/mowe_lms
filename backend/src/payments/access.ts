import { config } from "../config.js";
import { db } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";

export const paymentsRequired =
  !config.OPEN_COURSE_ACCESS &&
  (config.PAYMENTS_REQUIRED ?? Boolean(config.PAYSTACK_SECRET_KEY));
export const paymentMode = config.PAYSTACK_SECRET_KEY?.startsWith("sk_live_")
  ? "live"
  : "test";

export async function paidCourses(
  userId: string,
  client: Prisma.TransactionClient = db,
) {
  if (!paymentsRequired) return undefined;
  const payments = await client.payment.findMany({
    where: { userId, mode: paymentMode, status: "paid" },
    select: { courseIds: true },
  });
  return new Set(payments.flatMap(({ courseIds }) => courseIds));
}
