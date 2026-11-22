"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { learningRequest } from "../lib/auth";
import { Button } from "./ui";

// Serialize writes for the same learner and lesson, including across remounts.
const pending = new Map<string, Promise<unknown>>();

export default function LessonNotes({
  userId,
  lessonId,
  savedNote,
  hidden,
  onSaved,
}: {
  userId: string;
  lessonId: string;
  savedNote: string;
  hidden: boolean;
  onSaved: () => Promise<unknown>;
}) {
  const draftKey = `mowe-note:${userId}:${lessonId}`;
  const [text, setText] = useState(savedNote);
  const [status, setStatus] = useState("saved");
  const [error, setError] = useState("");
  const current = useRef(savedNote);
  const confirmed = useRef(savedNote);
  const mounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refresh = useRef(onSaved);
  refresh.current = onSaved;

  function keepDraft(value: string) {
    try {
      localStorage.setItem(draftKey, value);
    } catch {}
  }

  async function save() {
    clearTimeout(timer.current);
    const snapshot = current.current;
    if (snapshot === confirmed.current && !pending.has(draftKey)) return;
    keepDraft(snapshot);
    if (mounted.current) {
      setStatus("saving");
      setError("");
    }
    const previous = pending.get(draftKey) ?? Promise.resolve();
    const request = previous
      .catch(() => {})
      .then(() =>
        learningRequest("/actions", {
          action: "progress",
          payload: { lessonId, note: snapshot },
        }),
      );
    pending.set(draftKey, request);
    try {
      await request;
      confirmed.current = snapshot;
      // A newer edit or mounted editor owns the draft until its save succeeds.
      if (pending.get(draftKey) === request && current.current === snapshot) {
        try {
          if (localStorage.getItem(draftKey) === snapshot)
            localStorage.removeItem(draftKey);
        } catch {}
      }
      if (mounted.current) {
        setStatus(current.current === snapshot ? "saved" : "unsaved");
        void refresh.current().catch(() => {});
      }
    } catch (failure) {
      if (mounted.current) {
        setStatus("error");
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to save your notes.",
        );
      }
    } finally {
      if (pending.get(draftKey) === request) pending.delete(draftKey);
    }
  }

  useEffect(() => {
    mounted.current = true;
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft !== null && draft !== confirmed.current) {
        current.current = draft;
        setText(draft);
        setStatus("unsaved");
        timer.current = setTimeout(() => void save(), 1000);
      }
    } catch {}
    const flush = () => {
      if (current.current !== confirmed.current) void save();
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (current.current !== confirmed.current || pending.has(draftKey)) {
        keepDraft(current.current);
        event.preventDefault();
      }
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("beforeunload", beforeUnload);
      if (current.current !== confirmed.current) void save();
    };
    // The parent keys this editor by learner and lesson.
  }, [draftKey]);

  useEffect(() => {
    if (current.current === confirmed.current && !pending.has(draftKey)) {
      current.current = savedNote;
      confirmed.current = savedNote;
      setText(savedNote);
    }
  }, [savedNote, draftKey]);

  return (
    <section
      className="panel lesson-notes"
      hidden={hidden}
      aria-label="My lesson notes"
    >
      <div className="notes-heading">
        <div>
          <h2>My notes</h2>
          <p>Private to you. Saved automatically to your account.</p>
        </div>
        <span className={`notes-status ${status}`} role="status">
          {status === "saved" && <CheckCircle2 size={15} />}
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved"
              : status === "error"
                ? "Save failed"
                : "Unsaved changes"}
        </span>
      </div>
      <textarea
        aria-label="Notes for this lesson"
        id={`notes-${lessonId}`}
        rows={12}
        maxLength={20000}
        value={text}
        placeholder="Write your notes here…"
        onBlur={() => {
          if (current.current !== confirmed.current) void save();
        }}
        onChange={(event) => {
          const value = event.target.value;
          current.current = value;
          setText(value);
          keepDraft(value);
          setStatus("unsaved");
          setError("");
          clearTimeout(timer.current);
          timer.current = setTimeout(() => void save(), 1200);
        }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "s") {
            event.preventDefault();
            void save();
          }
        }}
      />
      {error && (
        <p className="service-error" role="alert">
          {error} Your draft is kept on this device. Try saving again.
        </p>
      )}
      <div className="notes-footer">
        <small>{text.length.toLocaleString()} / 20,000 characters</small>
        <Button
          secondary
          disabled={status === "saving" || status === "saved"}
          onClick={() => void save()}
        >
          <Save size={16} /> {status === "error" ? "Retry save" : "Save now"}
        </Button>
      </div>
    </section>
  );
}
