import { z } from "zod";
import { db } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";

const amount = z.number().int().min(10_000).max(100_000_000);
export const pricingSchema = z
  .object({
    bundleAmount: amount.default(70_000_000),
    courseAmounts: z.record(z.string().max(100), amount).default({}),
  })
  .strict();

export async function pricing(client: Prisma.TransactionClient = db) {
  const row = await client.academySetting.findUnique({
    where: { id: "pricing" },
  });
  return pricingSchema.parse(row?.document ?? {});
}

export function pricedCourses<T extends { id: string; title: string }>(
  courses: T[],
  prices: z.infer<typeof pricingSchema>,
) {
  return courses.map(({ id, title }) => ({
    id,
    title,
    amount: prices.courseAmounts[id] ?? 10_000_000,
  }));
}
