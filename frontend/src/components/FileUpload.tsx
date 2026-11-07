"use client";
import { Upload, LoaderCircle } from "lucide-react";
import { useState } from "react";
export type UploadedFile = {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  purpose: string;
  created: string;
};
export default function FileUpload({
  purpose,
  courseId,
  busy,
  upload,
  onUploaded,
}: {
  purpose: "resource" | "assignment" | "photo" | "video";
  courseId?: string;
  busy: boolean;
  upload: (
    file: File,
    purpose: string,
    courseId?: string,
  ) => Promise<UploadedFile | null>;
  onUploaded: (file: UploadedFile) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const accept =
    purpose === "photo"
      ? ".png,.jpg,.jpeg,.webp"
      : purpose === "video"
        ? ".mp4,.webm"
        : ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp";
  return (
    <label className="file-upload" aria-busy={uploading}>
      {uploading ? (
        <LoaderCircle size={20} className="spin" />
      ) : (
        <Upload size={20} />
      )}
      <span>
        {uploading
          ? "Uploading…"
          : purpose === "video"
            ? "Upload a video"
            : purpose === "photo"
              ? "Upload a profile photo"
              : purpose === "assignment"
                ? "Attach your assignment"
                : "Upload a learning resource"}
      </span>
      <small>
        {purpose === "photo"
          ? "JPG, PNG or WebP · Up to 5 MB"
          : purpose === "video"
            ? "MP4 or WebM · Up to 20 MB"
            : "PDF, DOCX, text or images · Up to 20 MB"}
      </small>
      <input
        type="file"
        accept={accept}
        disabled={busy || uploading}
        aria-label={
          purpose === "assignment"
            ? "Upload assignment attachment"
            : purpose === "photo"
              ? "Upload profile photo"
              : purpose === "video"
                ? "Upload lesson video"
                : "Upload lesson resource"
        }
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (!file) return;
          setUploading(true);
          try {
            const result = await upload(file, purpose, courseId);
            if (result) onUploaded(result);
          } finally {
            setUploading(false);
          }
        }}
      />
    </label>
  );
}
