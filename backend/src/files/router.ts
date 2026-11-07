import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { db } from "../db.js";
import { csrf, requireSession, HttpError } from "../http.js";
import { limit } from "../auth/rate-limit.js";
import { storeFile, downloadFile, destroyFile } from "./storage.js";
import { validateFile } from "./validation.js";
import { filePath, fileView, mediaList } from "./service.js";
import { notifyLearningChange } from "../learning/updates.js";
const multipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 3, parts: 4 },
});
export const files = Router();
let activeUploads = 0;
files.get("/", async (req, res) => {
  const session = await requireSession(req);
  if (session.user.role === "STUDENT")
    throw new HttpError(403, "Administrator access required.");
  res.json(
    await mediaList(
      typeof req.query.cursor === "string" ? req.query.cursor : undefined,
    ),
  );
});
files.post(
  "/",
  csrf,
  async (req, res, next) => {
    const session = await requireSession(req);
    await limit("upload", session.userId, 30, 3600);
    if (activeUploads >= 4)
      throw new HttpError(503, "Uploads are busy. Please try again shortly.");
    activeUploads++;
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        activeUploads--;
      }
    };
    res.once("finish", release);
    res.once("close", release);
    next();
  },
  multipart.single("file"),
  async (req, res) => {
    const session = await requireSession(req);
    const input = z
      .object({
        purpose: z.enum(["resource", "assignment", "video", "photo"]),
        courseId: z.string().max(100).optional(),
      })
      .strict()
      .parse(req.body);
    if (
      ["resource", "video"].includes(input.purpose) &&
      session.user.role === "STUDENT"
    )
      throw new HttpError(
        403,
        "Only administrators can upload course materials.",
      );
    if (input.purpose === "assignment") {
      if (!input.courseId)
        throw new HttpError(400, "Choose a course for this assignment.");
      const [enrollment, course] = await Promise.all([
        db.learningRecord.findUnique({
          where: {
            userId_kind_key: {
              userId: session.userId,
              kind: "enroll",
              key: "program",
            },
          },
        }),
        db.course.findFirst({
          where: { id: input.courseId, status: "published", deletedAt: null },
        }),
      ]);
      if (!enrollment || !course)
        throw new HttpError(
          403,
          "Enroll in an available course before uploading an assignment.",
        );
    }
    if (!req.file) throw new HttpError(400, "Choose a file to upload.");
    const validated = await validateFile(req.file, input.purpose);
    const stored = await storeFile(
      req.file.buffer,
      input.purpose,
      validated.extension,
    );
    const cloudAsset = {
      publicId: stored.public_id,
      resourceType: stored.resource_type,
      deliveryType:
        stored.type || (input.purpose === "photo" ? "upload" : "authenticated"),
    };
    const asset = await db.fileAsset
      .create({
        data: {
          ...cloudAsset,
          ownerId: session.userId,
          format: stored.format || "",
          secureUrl: stored.secure_url,
          name: validated.name,
          mime: validated.mime,
          size: req.file.size,
          purpose: input.purpose,
          courseId: input.courseId || null,
        },
      })
      .catch(async (error) => {
        await destroyFile(cloudAsset).catch(() => {});
        throw error;
      });
    await notifyLearningChange(session.userId);
    res.status(201).json(fileView(asset));
  },
);
files.get("/:id", async (req, res) => {
  const session = await requireSession(req);
  const asset = await db.fileAsset.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!asset) throw new HttpError(404, "File not found.");
  if (session.user.role === "STUDENT" && asset.ownerId !== session.userId) {
    if (!["resource", "video"].includes(asset.purpose))
      throw new HttpError(403, "This file is private.");
    const enrollment = await db.learningRecord.findUnique({
      where: {
        userId_kind_key: {
          userId: session.userId,
          kind: "enroll",
          key: "program",
        },
      },
    });
    if (!enrollment)
      throw new HttpError(403, "Enroll to access this resource.");
    const [linked] = await db.$queryRaw<{ found: boolean }[]>`SELECT EXISTS (
      SELECT 1 FROM mowe_lms.lms_courses c
      CROSS JOIN LATERAL jsonb_array_elements(c.document->'modules') m
      CROSS JOIN LATERAL jsonb_array_elements(m->'lessons') l
      WHERE c.status='published' AND c."deletedAt" IS NULL AND (l->>'resourceUrl'=${filePath(asset.id)} OR l->>'videoUrl'=${filePath(asset.id)})
    ) AS found`;
    if (!linked.found)
      throw new HttpError(403, "This resource is not available.");
  }
  res.redirect(
    302,
    asset.purpose === "photo" ? asset.secureUrl : downloadFile(asset),
  );
});
files.delete("/:id", csrf, async (req, res) => {
  const session = await requireSession(req);
  const asset = await db.fileAsset.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!asset) throw new HttpError(404, "File not found.");
  if (session.user.role === "STUDENT" && asset.ownerId !== session.userId)
    throw new HttpError(403, "This file is private.");
  const path = filePath(asset.id);
  const [used] = await db.$queryRaw<{ found: boolean }[]>`SELECT (
    EXISTS(SELECT 1 FROM mowe_lms.lms_courses WHERE document::text LIKE ${"%" + path + "%"})
    OR EXISTS(SELECT 1 FROM mowe_lms.lms_course_versions WHERE document::text LIKE ${"%" + path + "%"})
    OR EXISTS(SELECT 1 FROM mowe_lms.lms_learning_records WHERE kind='assignment' AND document->>'file'=${asset.id})
    OR EXISTS(SELECT 1 FROM mowe_lms.lms_auth_users WHERE "photoUrl"=${asset.secureUrl})
  ) AS found`;
  if (used.found)
    throw new HttpError(
      409,
      "This file is in use by a course, saved version or assignment.",
    );
  await destroyFile(asset);
  await db.fileAsset.delete({ where: { id: asset.id } });
  await notifyLearningChange(session.userId);
  res.json({ ok: true });
});
