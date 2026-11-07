import { z } from "zod";
import { inviteAdmin } from "../auth/service.js";
import { db } from "../db.js";
import { closeMail } from "../mail.js";
try {
  const email = z.string().trim().toLowerCase().email().parse(process.argv[2]);
  await inviteAdmin(email);
  console.log("Administrator invitation sent. Check the recipient’s email.");
} catch {
  console.error(
    "Unable to send invitation. Check the email argument, database and SMTP configuration.",
  );
  process.exitCode = 1;
} finally {
  closeMail();
  await db.$disconnect();
}
