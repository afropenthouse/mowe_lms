import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db.js";
import { HttpError } from "../http.js";
import { Prisma } from "../generated/prisma/client.js";
import { notifyLearningChange } from "./updates.js";

export const audienceSchema = z
  .object({
    audience: z.enum(["all", "selected", "groups"]),
    learnerIds: z.array(z.string().min(1).max(100)).max(500).default([]),
    groups: z
      .array(z.enum(["enrolled", "not-enrolled", "certified", "in-progress"]))
      .max(4)
      .default([]),
    courseIds: z.array(z.string().min(1).max(100)).max(100).default([]),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.audience === "selected" && !v.learnerIds.length)
      ctx.addIssue({
        code: "custom",
        message: "Select at least one learner.",
        path: ["learnerIds"],
      });
    if (v.audience === "groups" && !v.groups.length && !v.courseIds.length)
      ctx.addIssue({
        code: "custom",
        message: "Select at least one learner group or course.",
        path: ["groups"],
      });
  });
export const announcementSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(5000),
    targeting: audienceSchema,
  })
  .strict();
type Targeting = z.infer<typeof audienceSchema>;
export async function announcementRecipients(
  target: Targeting,
  client: Prisma.TransactionClient = db,
) {
  if (target.courseIds.length) {
    const count = await client.course.count({
      where: {
        id: { in: [...new Set(target.courseIds)] },
        deletedAt: null,
        status: "published",
      },
    });
    if (count !== new Set(target.courseIds).size)
      throw new HttpError(
        400,
        "Choose published courses from the current catalogue.",
      );
  }
  const enrolled = { learning: { some: { kind: "enroll", key: "program" } } };
  const certified = {
    learning: { some: { kind: "certificate", key: "program" } },
  };
  const groups: Prisma.UserWhereInput[] = target.groups.map((group) => {
    if (group === "enrolled") return enrolled;
    if (group === "not-enrolled") return { NOT: enrolled };
    if (group === "certified") return certified;
    return { AND: [enrolled, { NOT: certified }] };
  });
  if (target.courseIds.length) {
    const courses = await client.course.findMany({
      where: { id: { in: target.courseIds } },
      select: { document: true },
    });
    const lessons = courses.flatMap((c) =>
      (c.document as any).modules.flatMap((m: any) =>
        m.lessons.map((l: any) => l.id),
      ),
    ) as string[];
    groups.push({
      OR: [
        { quizAttempts: { some: { courseId: { in: target.courseIds } } } },
        {
          learning: {
            some: {
              OR: [
                { kind: "assignment", key: { in: target.courseIds } },
                { kind: "progress", key: { in: lessons } },
              ],
            },
          },
        },
      ],
    });
  }
  return client.user.findMany({
    where: {
      role: "STUDENT",
      emailVerifiedAt: { not: null },
      suspendedAt: null,
      ...(target.audience === "selected"
        ? { id: { in: target.learnerIds } }
        : target.audience === "groups"
          ? { OR: groups }
          : {}),
    },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
}
export async function sendAnnouncement(
  input: z.infer<typeof announcementSchema>,
  sender: { id: string; name: string },
) {
  const sent = await db.$transaction(async (tx) => {
    const recipients = await announcementRecipients(input.targeting, tx);
    if (!recipients.length)
      throw new HttpError(
        400,
        "No active, verified learners match this audience.",
      );
    if (
      input.targeting.audience === "selected" &&
      recipients.length !== new Set(input.targeting.learnerIds).size
    )
      throw new HttpError(
        400,
        "Some selected learners are unavailable. Review your selection.",
      );
    const id = randomUUID(),
      sentAt = new Date().toISOString();
    const message = {
      id,
      title: input.title,
      body: input.body,
      senderName: sender.name,
      sentAt,
      readAt: null,
    };
    for (let i = 0; i < recipients.length; i += 500)
      await tx.learningRecord.createMany({
        data: recipients.slice(i, i + 500).map((u) => ({
          userId: u.id,
          kind: "notification",
          key: id,
          document: message,
        })),
      });
    const document = {
      ...message,
      senderId: sender.id,
      targeting: input.targeting,
      recipientCount: recipients.length,
    };
    await tx.academySetting.create({
      data: { id: "announcement:" + id, document },
    });
    return document;
  });
  await notifyLearningChange(undefined, true);
  return sent;
}
export async function learnerNotifications(userId: string, page = 1) {
  const where = { userId, kind: "notification" };
  const [rows, total, unread] = await Promise.all([
    db.learningRecord.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 20,
      take: 20,
    }),
    db.learningRecord.count({ where }),
    db.learningRecord.count({
      where: {
        ...where,
        document: { path: ["readAt"], equals: Prisma.JsonNull },
      },
    }),
  ]);
  return {
    notifications: rows.map((r) => ({
      ...(r.document as Record<string, unknown>),
      id: r.key,
    })),
    total,
    unread,
    page,
    pageSize: 20,
  };
}
