import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { HttpError } from "../http.js";

export const referenceSchema = z.string().regex(/^mowe-[a-f0-9]{32}$/);

async function request<T>(path: string, schema: z.ZodType<T>, body?: object) {
  if (!config.PAYSTACK_SECRET_KEY)
    throw new HttpError(503, "Payment checkout is temporarily unavailable.");
  try {
    const response = await fetch("https://api.paystack.co" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
        ...(body && { "Content-Type": "application/json" }),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("Paystack request failed");
    return z
      .object({ status: z.literal(true), data: schema })
      .parse(await response.json()).data;
  } catch {
    throw new HttpError(
      502,
      "Paystack could not confirm this request. Please try again.",
    );
  }
}

export function initializePayment(
  reference: string,
  email: string,
  amount: number,
) {
  return request(
    "/transaction/initialize",
    z.object({
      reference: z.literal(reference),
      authorization_url: z
        .url()
        .refine(
          (value) => new URL(value).origin === "https://checkout.paystack.com",
        ),
    }),
    {
      reference,
      email,
      amount: String(amount),
      currency: "NGN",
      callback_url: new URL("/payments", config.FRONTEND_URL).href,
    },
  );
}

export function verifyPayment(reference: string) {
  return request(
    `/transaction/verify/${reference}`,
    z.object({
      reference: z.literal(reference),
      amount: z.number().int(),
      currency: z.literal("NGN"),
      domain: z.enum(["test", "live"]),
      status: z.string(),
      paid_at: z.iso.datetime({ offset: true }).nullish(),
    }),
  );
}

export function authenticWebhook(
  raw: Buffer,
  header?: string,
  legacy?: string,
) {
  const matches = (digest: Buffer, value: string) =>
    /^[a-f0-9]{128}$/.test(value) &&
    timingSafeEqual(digest, Buffer.from(value, "hex"));
  if (config.PAYSTACK_WEBHOOK_SECRET && header) {
    const fields = header.split(",").map((field) => field.trim());
    const timestamp =
      fields.find((field) => field.startsWith("t="))?.slice(2) ?? "";
    if (
      !/^\d{10}$/.test(timestamp) ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
    )
      return false;
    const digest = createHmac("sha512", config.PAYSTACK_WEBHOOK_SECRET)
      .update(timestamp + ".")
      .update(raw)
      .digest();
    return fields.some(
      (field) =>
        field.startsWith("v1=whk_") &&
        matches(digest, field.split(":")[1] ?? ""),
    );
  }
  return Boolean(
    config.PAYSTACK_SECRET_KEY &&
    legacy &&
    matches(
      createHmac("sha512", config.PAYSTACK_SECRET_KEY).update(raw).digest(),
      legacy,
    ),
  );
}
