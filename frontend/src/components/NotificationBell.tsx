"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Bell, CheckCheck, ChevronDown, LoaderCircle, X } from "lucide-react";
import { useAcademy } from "../providers/AcademyProvider";
import { useServiceData } from "../lib/useAdminData";
import { authRequest } from "../lib/auth";

export default function NotificationBell() {
  const { data, path } = useAcademy();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    panelId = useId();
  const unread = data.notificationUnread || 0;
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div className="notification-control" ref={wrapper}>
      <button
        ref={trigger}
        className="icon-btn notification-trigger"
        aria-label={
          unread
            ? `${unread} unread notification${unread === 1 ? "" : "s"}`
            : "Notifications"
        }
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(!open)}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="notification-count" aria-hidden="true">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <NotificationDropdown
          id={panelId}
          onClose={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
        />
      )}
    </div>
  );
}
type Message = {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  readAt: string | null;
};
function NotificationDropdown({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1),
    [expanded, setExpanded] = useState<string | null>(null),
    [working, setWorking] = useState(false),
    [actionError, setActionError] = useState("");
  const { refresh: refreshAcademy } = useAcademy();
  const { data, loading, error, refresh } = useServiceData<{
    notifications: Message[];
    unread: number;
    total: number;
  }>("/notifications?page=" + page, "/api/learning");
  async function markRead(messageId?: string) {
    if (working) return;
    setWorking(true);
    setActionError("");
    try {
      await authRequest(
        "/notifications/read",
        messageId ? { id: messageId } : {},
        "PATCH",
        true,
        "/api/learning",
      );
      await Promise.all([refresh(true), refreshAcademy()]);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Unable to mark notification as read.",
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <section
      className="notification-dropdown"
      id={id}
      aria-label="Notifications"
    >
      <div className="notification-dropdown-heading">
        <div>
          <h2>Notifications</h2>
          <span>{data ? `${data.unread} unread` : "Your academy updates"}</span>
        </div>
        <button
          className="icon-btn"
          aria-label="Close notifications"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      {data && data.unread > 0 && (
        <button
          className="notification-read-all"
          disabled={working}
          onClick={() => markRead()}
        >
          <CheckCheck size={15} />
          Mark all as read
        </button>
      )}
      {(error || actionError) && (
        <div className="notification-dropdown-error" role="alert">
          {error || actionError}
          <button onClick={() => refresh()}>Try again</button>
        </div>
      )}
      <div className="notification-dropdown-list">
        {loading && !data ? (
          <div className="notification-dropdown-empty" role="status">
            <LoaderCircle size={22} className="spin" />
            Loading notifications
          </div>
        ) : data?.notifications.length ? (
          data.notifications.map((m) => (
            <article
              key={m.id}
              className={`notification-message ${m.readAt ? "" : "unread"}`}
            >
              <button
                className="notification-message-heading"
                aria-expanded={expanded === m.id}
                onClick={() => {
                  setExpanded(expanded === m.id ? null : m.id);
                  if (!m.readAt && !working) markRead(m.id);
                }}
              >
                <strong>{m.title}</strong>
                <ChevronDown
                  size={15}
                  className={expanded === m.id ? "expanded" : ""}
                />
              </button>
              <p
                className={
                  expanded === m.id
                    ? "notification-message-body expanded"
                    : "notification-message-body"
                }
              >
                {m.body}
              </p>
              <small>
                {new Date(m.sentAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </small>
              {!m.readAt && expanded === m.id && (
                <button
                  className="notification-read-all"
                  disabled={working}
                  onClick={() => markRead(m.id)}
                >
                  Mark as read
                </button>
              )}
            </article>
          ))
        ) : (
          !error &&
          data && (
            <div className="notification-dropdown-empty">
              <Bell size={26} />
              <strong>You’re all caught up</strong>
              <p>Updates from your academy will appear here.</p>
            </div>
          )
        )}
      </div>
      {data && data.total > 20 && (
        <div className="notification-dropdown-pagination">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            {page} / {Math.ceil(data.total / 20)}
          </span>
          <button
            disabled={page * 20 >= data.total || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
