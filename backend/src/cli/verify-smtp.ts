import { verifySmtp, closeMail } from "../mail.js";
try {
  await verifySmtp();
  console.log("SMTP connection and authentication verified.");
} catch {
  console.error("SMTP verification failed. Check host, port and app password.");
  process.exitCode = 1;
} finally {
  closeMail();
}
