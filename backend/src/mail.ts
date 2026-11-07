import nodemailer from "nodemailer";
import { config } from "./config.js";
export type Mail = { to: string; subject: string; text: string; html: string };
export const testOutbox: Mail[] = [];
const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  pool: true,
  maxConnections: 2,
  auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  tls: { rejectUnauthorized: true },
  logger: false,
  debug: false,
});
export function mailTemplate(title: string, body: string) {
  return `<div style="background:#f5f7fa;padding:32px;font-family:Arial,sans-serif;color:#172335"><div style="max-width:520px;margin:auto;background:white;border-radius:12px;padding:36px;border-top:4px solid #c8281b"><div style="font-size:12px;letter-spacing:2px;color:#c8281b;font-weight:bold">MOWE ACADEMY</div><h1 style="font-size:26px;color:#0f2a52">${title}</h1>${body}<p style="font-size:12px;color:#78869a;margin-top:30px">If you did not request this, you can ignore this email.</p></div></div>`;
}
export async function sendMail(mail: Mail) {
  if (config.MAIL_DRIVER === "test") {
    testOutbox.push(mail);
    return;
  }
  await transport.sendMail({ from: config.MAIL_FROM, ...mail });
}
export async function sendCode(to: string, code: string, purpose: string) {
  const title =
    purpose === "VERIFY_EMAIL" ? "Verify your email" : "Reset your password";
  await sendMail({
    to,
    subject: `${title} for MOWE Academy`,
    text: `${title}\nYour verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
    html: mailTemplate(
      title,
      `<p>Use this code to continue your learning journey.</p><div style="font-size:36px;letter-spacing:10px;font-weight:bold;padding:24px;background:#f5f7fa;text-align:center;color:#0f2a52">${code}</div><p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>`,
    ),
  });
}
export async function verifySmtp() {
  if (config.MAIL_DRIVER === "test") return;
  await transport.verify();
}
export const closeMail = () => transport.close();
