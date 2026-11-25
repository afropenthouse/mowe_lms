import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";

const testDatabase = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : null;
const disposable =
  testDatabase?.hostname === "127.0.0.1" &&
  testDatabase.pathname.endsWith("_test");
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
process.env.PAYMENTS_REQUIRED = "true";
process.env.OPEN_COURSE_ACCESS = "false";
process.env.PAYSTACK_SECRET_KEY = "sk_test_fixture";

const { app } = await import("../src/app.js");
const { db } = await import("../src/db.js");
const { origin, SESSION_COOKIE } = await import("../src/config.js");
const { digest, token } = await import("../src/auth/crypto.js");
const { publishedCourses, courseLessons } =
  await import("../src/learning/progression.js");

test(
  "Paystack purchases gate coursework and preserve the ordered learning path",
  { skip: !disposable },
  async (t) => {
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = "http://127.0.0.1:" + address.port;
    const ids: string[] = [];
    const gateway = new Map<string, { amount: number; status: string }>();
    const network = globalThis.fetch;
    t.mock.method(globalThis, "fetch", (url: string, init?: RequestInit) => {
      if (!url.startsWith("https://api.paystack.co/"))
        return network(url, init);
      if (url.endsWith("/initialize")) {
        const { reference, amount, currency } = JSON.parse(String(init?.body));
        assert.equal(currency, "NGN");
        gateway.set(reference, { amount: Number(amount), status: "pending" });
        return Response.json({
          status: true,
          data: {
            reference,
            authorization_url: "https://checkout.paystack.com/" + reference,
          },
        });
      }
      const reference = url.split("/").at(-1)!;
      return Response.json({
        status: true,
        data: {
          ...gateway.get(reference),
          reference,
          currency: "NGN",
          domain: "test",
        },
      });
    });

    async function account(role: "STUDENT" | "ADMIN" = "STUDENT") {
      const user = await db.user.create({
        data: {
          role,
          name: "Payment Fixture",
          email: `payments-${randomUUID()}@example.test`,
          passwordHash: "fixture",
          emailVerifiedAt: new Date(),
        },
      });
      ids.push(user.id);
      const raw = token();
      await db.session.create({
        data: {
          userId: user.id,
          tokenHash: digest(raw),
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });
      const csrf = await fetch(base + "/auth/csrf");
      const cookie = csrf.headers.getSetCookie()[0].split(";")[0];
      const { csrfToken } = await csrf.json();
      return {
        id: user.id,
        async request(
          path: string,
          body?: unknown,
          method = body === undefined ? "GET" : "POST",
        ) {
          const response = await fetch(base + path, {
            method,
            headers: {
              Cookie: `${SESSION_COOKIE}=${raw}; ${cookie}`,
              Origin: origin,
              ...(body !== undefined && {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
              }),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
          });
          return { status: response.status, data: await response.json() };
        },
      };
    }

    try {
      const courses = await publishedCourses();
      const [first, second, third] = courses;
      assert.equal(
        courses.length,
        8,
        "Seed all eight courses in the test database first.",
      );
      const single = await account(),
        bundle = await account(),
        admin = await account("ADMIN");
      const firstCheckout = { kind: "course", courseId: first.id };
      const action = (name: string, payload = {}) => ({
        action: name,
        payload,
      });
      const state = async (learner: typeof single) =>
        (await learner.request("/learning/state")).data;
      const profile = { name: "Payment Fixture", phone: "+2348000000000" };
      const nextReference = () => [...gateway.keys()].at(-1)!;

      const savedLesson = courseLessons(first)[0];
      await db.learningRecord.createMany({
        data: [
          {
            userId: single.id,
            kind: "enroll",
            key: "program",
            document: { paymentExempt: true },
          },
          {
            userId: single.id,
            kind: "progress",
            key: savedLesson.id,
            document: { completed: 1 },
          },
        ],
      });
      const initial = await state(single);
      assert.equal(initial.enrolled, true);
      assert.ok(
        initial.progress.some(
          (entry: { lesson_id: string; completed: number }) =>
            entry.lesson_id === savedLesson.id && entry.completed === 1,
        ),
      );
      assert.deepEqual(
        (await single.request("/payments")).data.ownedCourseIds,
        [],
      );
      assert.equal(initial.courseAccess[first.id].status, "payment_required");
      assert.equal(initial.courseAccess[second.id].status, "locked");
      assert.equal(initial.courses[0].quiz.questions.length, 0);
      assert.equal(
        (await single.request("/learning/actions", action("enroll"))).status,
        403,
      );
      assert.equal(
        (
          await single.request(
            "/learning/actions",
            action("quizStart", { courseId: first.id }),
          )
        ).status,
        403,
      );
      assert.equal(
        (await single.request("/payments/checkout", firstCheckout)).status,
        400,
      );
      assert.equal(
        (await single.request("/payments/profile", profile, "PUT")).status,
        200,
      );
      assert.equal(
        (
          await single.request("/payments/checkout", {
            kind: "course",
            courseId: second.id,
          })
        ).status,
        403,
      );
      assert.equal(
        (await single.request("/payments/checkout", firstCheckout)).status,
        201,
      );
      const failed = nextReference();
      assert.equal(gateway.get(failed)?.amount, 10_000_000);
      gateway.get(failed)!.status = "abandoned";
      assert.equal(
        (await single.request("/payments/verify", { reference: failed })).data
          .payment.status,
        "pending",
      );
      assert.equal(
        (await single.request("/payments/checkout", { kind: "bundle" })).status,
        409,
      );
      gateway.get(failed)!.status = "failed";
      assert.equal(
        (await single.request("/payments/verify", { reference: failed })).data
          .payment.status,
        "failed",
      );
      assert.equal(
        (await state(single)).courseAccess[first.id].status,
        "payment_required",
      );
      assert.equal(
        (await single.request("/payments/checkout", firstCheckout)).status,
        201,
      );
      const reference = nextReference();
      gateway.set(reference, { amount: 1, status: "success" });
      assert.equal(
        (await single.request("/payments/verify", { reference })).status,
        409,
      );
      gateway.set(reference, { amount: 10_000_000, status: "success" });
      assert.equal(
        (await bundle.request("/payments/verify", { reference })).status,
        404,
      );
      assert.equal(
        (await single.request("/payments/verify", { reference })).data.payment
          .status,
        "paid",
      );
      assert.equal(
        (await state(single)).courseAccess[first.id].status,
        "available",
      );

      assert.equal(
        (await bundle.request("/payments/profile", profile, "PUT")).status,
        200,
      );
      assert.equal(
        (await bundle.request("/payments/checkout", { kind: "bundle" })).status,
        201,
      );
      const bundled = nextReference();
      assert.equal(gateway.get(bundled)?.amount, 70_000_000);
      gateway.get(bundled)!.status = "success";
      const event = JSON.stringify({
        event: "charge.success",
        data: { reference: bundled },
      });
      const signature = createHmac("sha512", "sk_test_fixture")
        .update(event)
        .digest("hex");
      const webhook = (value: string) =>
        fetch(base + "/payments/webhook", {
          method: "POST",
          body: event,
          headers: {
            "Content-Type": "application/json",
            "x-paystack-signature": value,
          },
        });
      assert.equal((await webhook("bad")).status, 401);
      assert.deepEqual(
        (await Promise.all([webhook(signature), webhook(signature)])).map(
          (r) => r.status,
        ),
        [200, 200],
      );
      assert.equal(
        (await state(bundle)).courseAccess[second.id].status,
        "locked",
      );
      assert.deepEqual(
        (await bundle.request("/payments")).data.ownedCourseIds,
        courses.map(({ id }) => id),
      );

      for (const learner of [single, bundle]) {
        await db.learningRecord.createMany({
          skipDuplicates: true,
          data: [
            ...courseLessons(first).map(({ id }) => ({
              userId: learner.id,
              kind: "progress",
              key: id,
              document: { completed: 1 },
            })),
            {
              userId: learner.id,
              kind: "assignment",
              key: first.id,
              document: { status: "graded" },
            },
          ],
        });
        await db.quizAttempt.create({
          data: {
            userId: learner.id,
            courseId: first.id,
            status: "graded",
            score: 100,
            assessment: first.quiz,
          },
        });
      }
      assert.equal(
        (await state(single)).courseAccess[second.id].status,
        "payment_required",
      );
      assert.equal(
        (await state(bundle)).courseAccess[second.id].status,
        "available",
      );
      assert.equal(
        (await state(bundle)).courseAccess[third.id].status,
        "locked",
      );
      const prices = {
        bundleAmount: 27_000_000,
        courseAmounts: { [second.id]: 11_000_000 },
      };
      assert.equal((await single.request("/admin/payments")).status, 403);
      assert.equal(
        (await admin.request("/admin/payments/pricing", prices, "PUT")).status,
        200,
      );
      assert.equal(
        (
          await single.request("/payments/checkout", {
            kind: "course",
            courseId: second.id,
          })
        ).status,
        201,
      );
      assert.equal(gateway.get(nextReference())?.amount, 11_000_000);
      const history = (await admin.request("/admin/payments")).data.payments;
      assert.equal(
        history.find((p: { reference: string }) => p.reference === bundled)
          .amount,
        70_000_000,
      );
    } finally {
      await db.payment.deleteMany({ where: { userId: { in: ids } } });
      await db.academySetting.deleteMany({
        where: {
          id: { in: ["pricing", ...ids.map((id) => "learning:user:" + id)] },
        },
      });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await db.$disconnect();
    }
  },
);
