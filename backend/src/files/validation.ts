import { fileTypeFromBuffer } from "file-type";
import { extname, basename } from "node:path";
import { HttpError } from "../http.js";
const types: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};
export async function validateFile(
  file: { originalname: string; buffer: Buffer; size: number },
  purpose: string,
) {
  const extension = extname(file.originalname).slice(1).toLowerCase();
  const allowed =
    purpose === "photo"
      ? ["png", "jpg", "jpeg", "webp"]
      : purpose === "video"
        ? ["mp4", "webm"]
        : ["pdf", "docx", "txt", "png", "jpg", "jpeg", "webp"];
  if (!allowed.includes(extension))
    throw new HttpError(
      400,
      "Choose a supported PDF, DOCX, text, image or video file.",
    );
  if (!file.size || file.size > (purpose === "photo" ? 5 : 20) * 1024 * 1024)
    throw new HttpError(
      400,
      purpose === "photo"
        ? "Photos must be between 1 byte and 5 MB."
        : "Files must be between 1 byte and 20 MB.",
    );
  if (extension === "txt") {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(file.buffer);
    } catch {
      throw new HttpError(400, "Choose a valid UTF-8 text file.");
    }
    if (file.buffer.includes(0))
      throw new HttpError(400, "This is not a supported text file.");
  } else {
    let detected;
    try {
      detected = await fileTypeFromBuffer(file.buffer);
    } catch {
      throw new HttpError(400, "This file appears to be damaged.");
    }
    if (!detected || detected.mime !== types[extension])
      throw new HttpError(400, "The file contents do not match its extension.");
  }
  const name = basename(file.originalname.replaceAll("\\", "/"))
    .replace(/[^\p{L}\p{N} ._()-]/gu, "_")
    .slice(0, 180);
  return {
    extension,
    name,
    mime: extension === "txt" ? "text/plain" : types[extension],
  };
}
