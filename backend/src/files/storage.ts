import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { config } from "../config.js";
import { HttpError } from "../http.js";
import { randomUUID } from "node:crypto";
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});
function configured() {
  if (
    !config.CLOUDINARY_CLOUD_NAME ||
    !config.CLOUDINARY_API_KEY ||
    !config.CLOUDINARY_API_SECRET
  )
    throw new HttpError(503, "File storage is not configured.");
}
export async function storeFile(
  buffer: Buffer,
  purpose: string,
  extension: string,
) {
  configured();
  const resource_type =
    purpose === "photo" ? "image" : purpose === "video" ? "video" : "raw";
  const type = purpose === "photo" ? "upload" : "authenticated";
  const public_id =
    "mowe-lms/" +
    purpose +
    "/" +
    randomUUID() +
    (resource_type === "raw" ? "." + extension : "");
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type,
        type,
        public_id,
        overwrite: false,
        timeout: 60000,
        ...(purpose === "photo"
          ? { transformation: [{ width: 512, height: 512, crop: "limit" }] }
          : {}),
      },
      (error, result) =>
        error || !result
          ? reject(
              new HttpError(
                502,
                "The upload could not be completed. Please try again.",
              ),
            )
          : resolve(result),
    );
    stream.end(buffer);
  });
}
export function downloadFile(asset: {
  publicId: string;
  resourceType: string;
  deliveryType: string;
  format: string;
  purpose: string;
}) {
  configured();
  return cloudinary.utils.private_download_url(asset.publicId, asset.format, {
    resource_type: asset.resourceType,
    type: asset.deliveryType,
    attachment: asset.purpose !== "video",
    expires_at: Math.floor(Date.now() / 1000) + 120,
  });
}
export async function destroyFile(asset: {
  publicId: string;
  resourceType: string;
  deliveryType: string;
}) {
  configured();
  const result = await cloudinary.uploader.destroy(asset.publicId, {
    resource_type: asset.resourceType as "raw" | "image" | "video",
    type: asset.deliveryType,
    invalidate: true,
  });
  if (!["ok", "not found"].includes(result.result))
    throw new HttpError(
      502,
      "The file could not be deleted. Please try again.",
    );
}
