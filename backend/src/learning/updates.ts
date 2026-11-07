import { randomUUID } from "node:crypto";
import { db } from "../db.js";
export async function learningRevision(userId?: string, isAdmin = false) {
  const keys = [
    "learning:content",
    ...(userId ? ["learning:user:" + userId] : []),
    ...(isAdmin ? ["learning:admin"] : []),
  ];
  const rows = await db.academySetting.findMany({
    where: { id: { in: keys } },
  });
  return keys
    .map(
      (key) =>
        (
          rows.find((r) => r.id === key)?.document as
            { revision?: string } | undefined
        )?.revision || "initial",
    )
    .join(":");
}
export async function notifyLearningChange(userId?: string, content = false) {
  const keys = [
    "learning:admin",
    ...(content ? ["learning:content"] : []),
    ...(userId ? ["learning:user:" + userId] : []),
  ];
  const document = { revision: randomUUID() };
  await db.$transaction(
    keys.map((id) =>
      db.academySetting.upsert({
        where: { id },
        create: { id, document },
        update: { document },
      }),
    ),
  );
}
