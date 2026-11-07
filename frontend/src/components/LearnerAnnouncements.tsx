"use client";
import { useState } from "react";
import { CheckCheck, LoaderCircle, Megaphone } from "lucide-react";
import { useServiceData } from "../lib/useAdminData";
import { authRequest } from "../lib/auth";
import { useAcademy } from "../providers/AcademyProvider";
type Message = {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  readAt: string | null;
};
export default function LearnerAnnouncements() {
  const [page, setPage] = useState(1),
    [working, setWorking] = useState(false),
    [actionError, setActionError] = useState("");
  const { refresh: refreshAcademy } = useAcademy();
  const { data, loading, error, refresh } = useServiceData<{
    notifications: Message[];
    unread: number;
    total: number;
  }>("/notifications?page=" + page, "/api/learning");
  async function markRead(id?: string) {
    if (working) return;
    setWorking(true);
    setActionError("");
    try {
      await authRequest(
        "/notifications/read",
        id ? { id } : {},
        "PATCH",
        true,
        "/api/learning",
      );
      await Promise.all([refresh(), refreshAcademy()]);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Unable to update this notification.",
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="people-page announcements-page">
      <header className="people-heading">
        <div>
          <h1>Notifications</h1>
          <p>News, reminders and updates from your academy.</p>
        </div>
        <button
          className="people-secondary"
          disabled={working || !data?.unread}
          onClick={() => markRead()}
        >
          <CheckCheck size={17} />
          Mark all as read
        </button>
      </header>
      {(error || actionError) && (
        <div className="editor-validation" role="alert">
          {error || actionError}
          <button onClick={() => refresh()}>Try again</button>
        </div>
      )}
      <section className="people-surface">
        <div className="certificate-register-heading">
          <h2>Your inbox</h2>
          <span className="pill">{data?.unread || 0} unread</span>
        </div>
        {loading && !data ? (
          <div className="empty" role="status">
            <LoaderCircle className="spin" />
            Loading notifications
          </div>
        ) : data?.notifications.length ? (
          data.notifications.map((m) => (
            <article
              className={`announcement-card ${m.readAt ? "" : "unread"}`}
              key={m.id}
            >
              <div className="announcement-meta">
                <span>{new Date(m.sentAt).toLocaleString("en-GB")}</span>
                {!m.readAt && <span className="announcement-unread">New</span>}
              </div>
              <h3>{m.title}</h3>
              <p className="announcement-body">{m.body}</p>
              {!m.readAt && (
                <button
                  className="text-link"
                  disabled={working}
                  onClick={() => markRead(m.id)}
                >
                  <CheckCheck size={15} />
                  Mark as read
                </button>
              )}
            </article>
          ))
        ) : (
          <div className="empty">
            <Megaphone size={34} />
            <h3>You’re all caught up</h3>
            <p>Notifications from your academy will appear here.</p>
          </div>
        )}
        <div className="certificate-pagination">
          <span>
            Page {page} of {Math.max(1, Math.ceil((data?.total || 0) / 20))}
          </span>
          <div>
            <button
              className="people-secondary"
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="people-secondary"
              disabled={page * 20 >= (data?.total || 0) || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
