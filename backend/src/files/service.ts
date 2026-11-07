import { db } from "../db.js";
import { HttpError } from "../http.js";
import type { CourseDocument } from "../learning/validation.js";
export const filePath = (id: string) => "/api/files/" + id;
export function fileView(a: {
  id: string;
  name: string;
  mime: string;
  size: number;
  purpose: string;
  createdAt: Date;
  secureUrl: string;
}) {
  return {
    id: a.id,
    name: a.name,
    type: a.mime,
    size: a.size,
    purpose: a.purpose,
    created: a.createdAt.toISOString(),
    url: a.purpose === "photo" ? a.secureUrl : filePath(a.id),
  };
}
export async function mediaList(cursor?: string) {
  const rows = await db.fileAsset.findMany({
    where: { purpose: { in: ["resource", "video"] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 51,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return {
    files: rows.slice(0, 50).map(fileView),
    nextCursor: rows.length > 50 ? rows[49].id : null,
  };
}
export async function validateCourseFiles(
  course: CourseDocument,
  store: Pick<typeof db, "fileAsset"> = db,
) {
  const referenced = course.modules
    .flatMap((m) =>
      m.lessons.flatMap((l) => [
        { url: l.resourceUrl, purpose: "resource" },
        { url: l.videoUrl, purpose: "video" },
      ]),
    )
    .filter((v) => v.url.startsWith("/api/files/"));
  if (!referenced.length) return;
  const files = await store.fileAsset.findMany({
    where: { id: { in: referenced.map((v) => v.url.slice(11)) } },
  });
  if (
    referenced.some(
      (v) =>
        !files.some((a) => filePath(a.id) === v.url && a.purpose === v.purpose),
    )
  )
    throw new HttpError(
      400,
      "A linked upload is missing or has the wrong file type. Choose another file.",
    );
}
