import { db } from "../db.js";
try {
  const now = new Date();
  await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  await db.authChallenge.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86400000) } },
  });
  await db.authRateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
  await db.adminInvitation.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86400000) } },
  });
  console.log("Expired authentication records removed.");
} finally {
  await db.$disconnect();
}
