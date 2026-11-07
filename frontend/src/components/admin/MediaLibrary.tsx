"use client";
import { Download, FileText, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import FileUpload, { type UploadedFile } from "../FileUpload";
import { authRequest } from "../../lib/auth";
import AccountDialog from "./AccountDialog";
export default function MediaLibrary({
  media,
  nextCursor,
  busy,
  upload,
  refresh,
  setToast,
}: {
  media: UploadedFile[];
  nextCursor: string | null;
  busy: boolean;
  upload: any;
  refresh: () => Promise<unknown>;
  setToast: (s: string) => void;
}) {
  const [purpose, setPurpose] = useState<"resource" | "video">("resource"),
    [extra, setExtra] = useState<UploadedFile[]>([]),
    [cursor, setCursor] = useState(nextCursor),
    [working, setWorking] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UploadedFile | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const first = media[0]?.id;
  useEffect(() => {
    setExtra([]);
    setCursor(nextCursor);
  }, [first, nextCursor]);
  const all = [...new Map([...media, ...extra].map((f) => [f.id, f])).values()];
  async function more() {
    setWorking(true);
    try {
      const result = await authRequest(
        "?cursor=" + encodeURIComponent(cursor!),
        undefined,
        "GET",
        true,
        "/api/files",
      );
      setExtra((old) => [...old, ...result.files]);
      setCursor(result.nextCursor);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Unable to load more files.");
    } finally {
      setWorking(false);
    }
  }
  async function remove(file: UploadedFile) {
    if (working) return;
    setDeleteError("");
    setWorking(true);
    try {
      await authRequest("/" + file.id, {}, "DELETE", true, "/api/files");
      setExtra((old) => old.filter((f) => f.id !== file.id));
      await refresh();
      setPendingDelete(null);
      setToast("File deleted");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Unable to delete file.");
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="content-library">
      {pendingDelete && (
        <AccountDialog
          title="Delete file?"
          busy={working}
          onClose={() => setPendingDelete(null)}
        >
          <p className="publish-confirmation-title">{pendingDelete.name}</p>
          <p className="account-dialog-description">
            This permanently removes the file from your media library. Files
            linked to course content or assignments cannot be deleted.
          </p>
          {deleteError && (
            <div className="editor-validation" role="alert">
              {deleteError}
            </div>
          )}
          <div className="account-dialog-actions">
            <button
              type="button"
              className="btn secondary"
              autoFocus
              disabled={working}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="people-danger-button"
              disabled={working}
              onClick={() => remove(pendingDelete)}
            >
              {working ? (
                <LoaderCircle size={17} className="spin" aria-hidden="true" />
              ) : (
                <Trash2 size={17} aria-hidden="true" />
              )}
              {working ? "Deleting…" : "Delete file"}
            </button>
          </div>
        </AccountDialog>
      )}
      <div className="library-breadcrumb">
        <span>Academy</span>
        <span>/</span>
        <span>Media library</span>
      </div>
      <header className="library-heading">
        <div>
          <h1>Media library</h1>
          <p>Upload resources and videos to use in your lessons.</p>
        </div>
      </header>
      <section className="panel" style={{ marginTop: 25 }}>
        <label>
          File category
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as "resource" | "video")}
          >
            <option value="resource">Document or image resource</option>
            <option value="video">Lesson video</option>
          </select>
        </label>
        <FileUpload
          purpose={purpose}
          busy={busy || working}
          upload={upload}
          onUploaded={() => {}}
        />
        <p className="field-hint">
          Uploaded files can be attached from the lesson editor. Learner
          assignment files are private and appear with their submissions.
        </p>
      </section>
      {all.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {all.map((file) => (
                <tr key={file.id}>
                  <td>
                    <FileText size={17} />
                    <strong>{file.name}</strong>
                  </td>
                  <td>
                    {file.purpose === "video"
                      ? "Video"
                      : file.type.split("/").pop()}
                  </td>
                  <td>
                    {file.size < 1024 * 1024
                      ? Math.ceil(file.size / 1024) + " KB"
                      : (file.size / 1024 / 1024).toFixed(1) + " MB"}
                  </td>
                  <td>{new Date(file.created).toLocaleDateString("en-GB")}</td>
                  <td>
                    <div className="button-row">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                      >
                        <Download size={15} />
                        Open
                      </a>
                      <button
                        className="icon-btn"
                        aria-label={"Delete " + file.name}
                        disabled={busy || working}
                        onClick={() => {
                          setDeleteError("");
                          setPendingDelete(file);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel">
          <h2>No files uploaded</h2>
          <p>Upload a resource above or attach one while editing a lesson.</p>
        </div>
      )}
      {cursor && (
        <button className="btn secondary" disabled={working} onClick={more}>
          {working ? <LoaderCircle size={17} className="spin" /> : null}Load
          more files
        </button>
      )}
    </div>
  );
}
