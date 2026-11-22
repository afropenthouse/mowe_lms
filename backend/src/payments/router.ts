import { randomUUID } from "node:crypto";
import { Router, raw } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { db } from "../db.js";
import { csrf, HttpError, requireSession } from "../http.js";
import type { Payment } from "../generated/prisma/client.js";
import { certificateSettings } from "../learning/certificates.js";
import {
  courseProgression,
  publishedCourses,
} from "../learning/progression.js";
import { notifyLearningChange } from "../learning/updates.js";
import { paidCourses, paymentMode, paymentsRequired } from "./access.js";
import {
  authenticWebhook,
  initializePayment,
  referenceSchema,
  verifyPayment,
} from "./paystack.js";
import { pricedCourses, pricing, pricingSchema } from "./pricing.js";

const profileKey = (userId: string) => ({
  userId,
  kind: "billing_profile",
  key: "program",
});
const orderBy = [{ createdAt: "desc" }, { reference: "desc" }] as const;
const pageSize = 20;

function view(payment: Payment) {
  const { reference, title, amount, status, mode, createdAt, paidAt } = payment;
  return { reference, title, amount, status, mode, createdAt, paidAt };
}

async function confirm(payment: Payment) {
  if (payment.status === "paid") return payment;
  const verified = await verifyPayment(payment.reference);
  if (verified.amount !== payment.amount || verified.domain !== payment.mode)
    throw new HttpError(409, "The payment details do not match this order.");
  if (verified.status === "success") {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_users WHERE id = ${payment.userId} FOR UPDATE`;
      const changed = await tx.payment.updateMany({
        where: { reference: payment.reference, status: { not: "paid" } },
        data: {
          status: "paid",
          paidAt: verified.paid_at ? new Date(verified.paid_at) : new Date(),
          checkoutUrl: null,
        },
      });
      if (changed.count) {
        const enrollment = {
          userId: payment.userId,
          kind: "enroll",
          key: "program",
        };
        await tx.learningRecord.upsert({
          where: { userId_kind_key: enrollment },
          create: {
            ...enrollment,
            document: { created: new Date().toISOString() },
          },
          update: {},
        });
      }
      return tx.payment.findUniqueOrThrow({
        where: { reference: payment.reference },
      });
    });
    await notifyLearningChange(payment.userId);
    return result;
  }
  // Paystack can report a newly initialized, reusable checkout as abandoned.
  if (["failed", "reversed"].includes(verified.status)) {
    await db.payment.updateMany({
      where: { reference: payment.reference, status: "pending" },
      data: { status: "failed", checkoutUrl: null },
    });
  }
  return db.payment.findUniqueOrThrow({
    where: { reference: payment.reference },
  });
}

export const paystackWebhook = Router();
paystackWebhook.post(
  "/",
  raw({ type: "application/json", limit: "128kb" }),
  async (req, res) => {
    if (
      !Buffer.isBuffer(req.body) ||
      !authenticWebhook(
        req.body,
        req.get("paystack-signature"),
        req.get("x-paystack-signature"),
      )
    )
      throw new HttpError(401, "Invalid webhook signature.");
    const event = JSON.parse(req.body.toString("utf8"));
    const reference = referenceSchema.safeParse(event.data?.reference);
    if (event.event === "charge.success" && reference.success) {
      const payment = await db.payment.findUnique({
        where: { reference: reference.data },
      });
      if (payment?.mode === paymentMode) {
        if (payment.status === "paid")
          await notifyLearningChange(payment.userId);
        else await confirm(payment);
      }
    }
    res.sendStatus(200);
  },
);

export const learnerPayments = Router();
learnerPayments.use(async (req, res, next) => {
  const session = await requireSession(req);
  if (session.user.role !== "STUDENT")
    throw new HttpError(403, "Learner access required.");
  res.locals.learner = {
    id: session.userId,
    name: session.user.name,
    email: session.user.email,
  };
  next();
});

learnerPayments.get("/", async (_req, res) => {
  const { id, name } = res.locals.learner as { id: string; name: string };
  const [courses, prices, profile, history, paid] = await Promise.all([
    publishedCourses(),
    pricing(),
    db.learningRecord.findUnique({
      where: { userId_kind_key: profileKey(id) },
    }),
    db.payment.findMany({
      where: { userId: id },
      orderBy: [...orderBy],
      take: pageSize,
    }),
    paidCourses(id),
  ]);
  const pending = await db.payment.findFirst({
    where: {
      userId: id,
      mode: paymentMode,
      status: "pending",
      OR: [
        { checkoutUrl: { not: null } },
        { createdAt: { gt: new Date(Date.now() - 120_000) } },
      ],
    },
  });
  res.json({
    courses: pricedCourses(courses, prices),
    bundleAmount: prices.bundleAmount,
    mode: paymentMode,
    checkoutEnabled: paymentsRequired && Boolean(config.PAYSTACK_SECRET_KEY),
    ownedCourseIds: paid ? [...paid] : [],
    profile: profile ? profile.document : { name, phone: "" },
    payments: history.map(view),
    pending: pending && { ...view(pending), checkoutUrl: pending.checkoutUrl },
  });
});

learnerPayments.use(csrf);
learnerPayments.put("/profile", async (req, res) => {
  const { id } = res.locals.learner;
  const profile = z
    .object({
      name: z.string().trim().min(2).max(120),
      phone: z
        .string()
        .trim()
        .max(32)
        .transform((value) => value.replace(/[ ()-]/g, ""))
        .pipe(
          z
            .string()
            .regex(
              /^\+?\d{7,15}$/,
              "Enter a phone number with 7 to 15 digits.",
            ),
        ),
    })
    .strict()
    .parse(req.body);
  const key = profileKey(id);
  await db.learningRecord.upsert({
    where: { userId_kind_key: key },
    create: { ...key, document: profile },
    update: { document: profile },
  });
  res.json({ profile });
});

learnerPayments.post("/checkout", async (req, res) => {
  if (!paymentsRequired || !config.PAYSTACK_SECRET_KEY)
    throw new HttpError(503, "Payment checkout is temporarily unavailable.");
  const { id, email } = res.locals.learner as { id: string; email: string };
  const selection = z
    .discriminatedUnion("kind", [
      z.object({ kind: z.literal("bundle") }).strict(),
      z
        .object({
          kind: z.literal("course"),
          courseId: z.string().min(1).max(100),
        })
        .strict(),
    ])
    .parse(req.body);
  const order = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM mowe_lms.lms_auth_users WHERE id = ${id} FOR UPDATE`;
    const pending = await tx.payment.findFirst({
      where: { userId: id, mode: paymentMode, status: "pending" },
    });
    if (pending?.checkoutUrl)
      throw new HttpError(
        409,
        "Finish or check your pending payment before starting a new one.",
      );
    if (pending && Date.now() - pending.createdAt.getTime() < 120_000)
      throw new HttpError(
        409,
        "Checkout is being prepared. Please try again shortly.",
      );
    if (pending)
      await tx.payment.update({
        where: { reference: pending.reference },
        data: { status: "failed" },
      });
    const [courses, prices, profile, records, attempts, certificate, program] =
      await Promise.all([
        publishedCourses(tx),
        pricing(tx),
        tx.learningRecord.findUnique({
          where: { userId_kind_key: profileKey(id) },
        }),
        tx.learningRecord.findMany({
          where: {
            userId: id,
            kind: { in: ["enroll", "progress", "assignment"] },
          },
        }),
        tx.quizAttempt.findMany({
          where: { userId: id, status: "graded" },
          select: { courseId: true, status: true, score: true },
        }),
        certificateSettings(tx),
        tx.academySetting.findUnique({ where: { id: "program" } }),
      ]);
    if (!profile)
      throw new HttpError(400, "Save your learner details before paying.");
    const enrollment = records.find(
      (entry) => entry.kind === "enroll" && entry.key === "program",
    );
    if (
      !enrollment &&
      (program?.document as { enrollmentOpen?: boolean } | null)
        ?.enrollmentOpen === false
    )
      throw new HttpError(403, "Enrollment is currently closed.");
    const owned = await paidCourses(id, tx);
    const offers = pricedCourses(courses, prices);
    const access = courseProgression(
      courses,
      records,
      attempts,
      certificate.requireAssignments,
      owned,
    );
    const next = offers.find(
      ({ id }) => access[id].status === "payment_required",
    );
    if (!next)
      throw new HttpError(409, "There is no course to pay for right now.");
    if (selection.kind === "course" && selection.courseId !== next.id)
      throw new HttpError(
        403,
        "You can only pay for the next course in your learning path.",
      );
    const bundle = selection.kind === "bundle";
    if (
      bundle &&
      (owned?.size ||
        offers.length < 2 ||
        prices.bundleAmount >
          offers.reduce((sum, offer) => sum + offer.amount, 0))
    )
      throw new HttpError(
        409,
        "The bundle is available before your first course purchase.",
      );
    return tx.payment.create({
      data: {
        reference: "mowe-" + randomUUID().replaceAll("-", ""),
        userId: id,
        mode: paymentMode,
        courseIds: bundle ? offers.map(({ id }) => id) : [next.id],
        amount: bundle ? prices.bundleAmount : next.amount,
        title: bundle ? "Full program" : next.title,
      },
    });
  });
  try {
    const checkout = await initializePayment(
      order.reference,
      email,
      order.amount,
    );
    const updated = await db.payment.updateMany({
      where: { reference: order.reference, status: "pending" },
      data: { checkoutUrl: checkout.authorization_url },
    });
    if (!updated.count)
      throw new HttpError(409, "This checkout expired. Start a new payment.");
    res.status(201).json({ checkoutUrl: checkout.authorization_url });
  } catch (error) {
    await db.payment.updateMany({
      where: { reference: order.reference, status: "pending" },
      data: { status: "failed" },
    });
    throw error;
  }
});

learnerPayments.post("/verify", async (req, res) => {
  const { reference } = z
    .object({ reference: referenceSchema })
    .strict()
    .parse(req.body);
  const payment = await db.payment.findFirst({
    where: { reference, userId: res.locals.learner.id, mode: paymentMode },
  });
  if (!payment) throw new HttpError(404, "Payment not found.");
  if (!payment.checkoutUrl && payment.status === "pending")
    throw new HttpError(409, "Checkout is still being prepared.");
  res.json({ payment: view(await confirm(payment)) });
});

export async function adminPaymentList(page: number) {
  const [payments, total, courses, prices] = await Promise.all([
    db.payment.findMany({
      orderBy: [...orderBy],
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.payment.count(),
    publishedCourses(),
    pricing(),
  ]);
  return {
    payments: payments.map((payment) => ({
      ...view(payment),
      learner: payment.user,
    })),
    total,
    page,
    pageSize,
    courses: pricedCourses(courses, prices),
    bundleAmount: prices.bundleAmount,
  };
}

export async function updatePricing(body: unknown) {
  const prices = pricingSchema.parse(body);
  const courses = pricedCourses(await publishedCourses(), prices);
  if (
    courses.length > 1 &&
    prices.bundleAmount >
      courses.reduce((sum, course) => sum + course.amount, 0)
  )
    throw new HttpError(
      400,
      "The bundle cannot cost more than the courses combined.",
    );
  await db.academySetting.upsert({
    where: { id: "pricing" },
    create: { id: "pricing", document: prices },
    update: { document: prices },
  });
}
