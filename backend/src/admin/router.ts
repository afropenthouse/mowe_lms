import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { csrf, requireSession, HttpError } from "../http.js";
import { notifyLearningChange } from "../learning/updates.js";
import { directoryQuery, getLearners, learnersCsv } from "./learners.js";
import { getReviewPage, reviewQuery } from "./reviews.js";
import {
  announcementSchema,
  audienceSchema,
  announcementRecipients,
  sendAnnouncement,
} from "../learning/announcements.js";
import {
  certificateQuery,
  certificateRegister,
  certificateSettings,
  certificateSettingsSchema,
  certificateView,
  issueCertificate,
} from "../learning/certificates.js";
export const administration = Router();
administration.use(async (req, _res, next) => {
  const session = await requireSession(req);
  if (session.user.role === "STUDENT")
    throw new HttpError(403, "Administrator access required.");
  next();
});
administration.get("/learners", async (req, res) =>
  res.json(await getLearners(directoryQuery.parse(req.query))),
);
administration.get("/reviews", async (req, res) => {
  res.json(await getReviewPage(reviewQuery.parse(req.query)));
});
administration.get("/learners/export", async (req, res) => {
  const data = await getLearners(directoryQuery.parse(req.query), false);
  res.setHeader("Content-Disposition", 'attachment; filename="learners.csv"');
  res.type("text/csv").send(learnersCsv(data));
});
administration.get("/team", async (req, res) => {
  const session = await requireSession(req);
  if (session.user.role !== "SUPERADMIN")
    throw new HttpError(403, "Super Admin access required.");
  const state = z
    .enum(["active", "removed"])
    .default("active")
    .parse(req.query.state);
  const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(1000000)
      .default(1)
      .parse(req.query.page),
    pageSize = 20;
  const where = {
    role: { in: ["ADMIN", "SUPERADMIN"] as ("ADMIN" | "SUPERADMIN")[] },
    suspendedAt: state === "removed" ? { not: null } : null,
  };
  const [admins, total, invitations] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        suspendedAt: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    db.user.count({ where }),
    db.adminInvitation.findMany({
      where: { consumedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  res.json({
    admins,
    total,
    page,
    pageSize,
    invitations,
    canManageAdministrators: session.user.role === "SUPERADMIN",
  });
});
administration.get("/certificates", async (req, res) => {
  const [register, settings] = await Promise.all([
    certificateRegister(certificateQuery.parse(req.query)),
    certificateSettings(),
  ]);
  res.json({ ...register, settings });
});
administration.get("/announcements", async (req, res) => {
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(1000000)
    .default(1)
    .parse(req.query.page);
  const [rows, total] = await Promise.all([
    db.$queryRaw<{ document: unknown; readCount: number }[]>`SELECT a.document,
      (SELECT count(*)::int FROM mowe_lms.lms_learning_records r WHERE r.kind='notification' AND r.key=a.document->>'id' AND r.document->>'readAt' IS NOT NULL) AS "readCount"
      FROM mowe_lms.lms_academy_settings a WHERE a.id LIKE 'announcement:%'
      ORDER BY a.document->>'sentAt' DESC,a.id DESC LIMIT 20 OFFSET ${(page - 1) * 20}`,
    db.academySetting.count({ where: { id: { startsWith: "announcement:" } } }),
  ]);
  res.json({
    messages: rows.map((r) => ({
      ...(r.document as object),
      readCount: r.readCount,
    })),
    total,
    page,
    pageSize: 20,
  });
});
administration.use(csrf);
administration.post("/announcements/preview", async (req, res) => {
  const recipients = await announcementRecipients(
    audienceSchema.parse(req.body),
  );
  res.json({ count: recipients.length });
});
administration.post("/announcements", async (req, res) => {
  const actor = await requireSession(req);
  res.json({
    message: await sendAnnouncement(announcementSchema.parse(req.body), {
      id: actor.userId,
      name: actor.user.name,
    }),
  });
});
administration.patch("/certificates/settings", async (req, res) => {
  const settings = certificateSettingsSchema.parse(req.body);
  await db.academySetting.upsert({
    where: { id: "certificates" },
    create: { id: "certificates", document: settings },
    update: { document: settings },
  });
  await notifyLearningChange(undefined, true);
  res.json({ settings });
});
administration.post("/certificates/issue", async (req, res) => {
  const actor = await requireSession(req);
  const { userId } = z
    .object({ userId: z.string().min(1) })
    .strict()
    .parse(req.body);
  const certificate = await issueCertificate(userId, actor.userId);
  await notifyLearningChange(userId, true);
  res.json({ certificate: certificateView(certificate) });
});
administration.patch("/learners/:id/status", async (req, res) => {
  const actor = await requireSession(req),
    target = String(req.params.id);
  const input = z
    .object({
      status: z.enum(["suspended", "active"]),
      reason: z.string().trim().max(500).default(""),
    })
    .strict()
    .refine((v) => v.status !== "suspended" || v.reason.length >= 5, {
      message: "Enter a reason with at least five characters.",
      path: ["reason"],
    })
    .parse(req.body);
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_challenges WHERE "userId"=${target} ORDER BY id FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_users WHERE id=${target} FOR UPDATE`;
    const account = await tx.user.findUnique({ where: { id: target } });
    if (!account) throw new HttpError(404, "Learner not found.");
    if (account.role !== "STUDENT")
      throw new HttpError(403, "Only learner accounts can be managed here.");
    await tx.user.update({
      where: { id: target },
      data: {
        suspendedAt:
          input.status === "suspended"
            ? account.suspendedAt || new Date()
            : null,
        suspensionReason: input.status === "suspended" ? input.reason : "",
        suspendedById: input.status === "suspended" ? actor.userId : null,
      },
    });
    if (input.status === "suspended") {
      await tx.session.deleteMany({ where: { userId: target } });
      await tx.authChallenge.updateMany({
        where: { userId: target, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    }
  });
  await notifyLearningChange(target);
  res.json({
    message:
      input.status === "suspended"
        ? "Learner suspended. Their active sessions have ended."
        : "Learner reactivated.",
  });
});
administration.delete("/invitations/:id", async (req, res) => {
  const session = await requireSession(req);
  if (session.user.role !== "SUPERADMIN")
    throw new HttpError(
      403,
      "Only the Super Admin can revoke administrator invitations.",
    );
  const changed = await db.adminInvitation.updateMany({
    where: { id: String(req.params.id), consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (!changed.count) throw new HttpError(404, "Pending invitation not found.");
  await notifyLearningChange();
  res.json({ message: "Invitation revoked." });
});

administration.patch("/team/:id/access", async (req, res) => {
  const actor = await requireSession(req);
  if (actor.user.role !== "SUPERADMIN")
    throw new HttpError(
      403,
      "Only the Super Admin can manage administrator access.",
    );
  const target = String(req.params.id);
  const { active } = z.object({ active: z.boolean() }).strict().parse(req.body);
  if (target === actor.userId)
    throw new HttpError(403, "You cannot remove your own access.");
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_challenges WHERE "userId"=${target} ORDER BY id FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_users WHERE id=${target} FOR UPDATE`;
    const account = await tx.user.findUnique({ where: { id: target } });
    if (!account) throw new HttpError(404, "Administrator not found.");
    if (account.role === "SUPERADMIN")
      throw new HttpError(
        403,
        "Super Admin accounts are protected from removal.",
      );
    if (account.role !== "ADMIN")
      throw new HttpError(403, "Choose an administrator account.");
    await tx.user.update({
      where: { id: target },
      data: {
        suspendedAt: active ? null : account.suspendedAt || new Date(),
        suspensionReason: active ? "" : "Administrator access removed",
        suspendedById: active ? null : actor.userId,
      },
    });
    if (!active) {
      await tx.session.deleteMany({ where: { userId: target } });
      await tx.authChallenge.updateMany({
        where: { userId: target, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    }
  });
  await notifyLearningChange(target);
  res.json({
    message: active
      ? "Administrator access restored."
      : "Administrator removed. Their active sessions have ended.",
  });
});
