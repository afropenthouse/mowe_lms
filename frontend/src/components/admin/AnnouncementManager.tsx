"use client";
import { useEffect, useState } from "react";
import { LoaderCircle, Megaphone, Plus, Send, Search, X } from "lucide-react";
import { useAdminData } from "../../lib/useAdminData";
import { authRequest } from "../../lib/auth";
import { useAcademy } from "../../providers/AcademyProvider";
import AccountDialog from "./AccountDialog";
type Audience = {
  audience: "all" | "selected" | "groups";
  learnerIds: string[];
  groups: string[];
  courseIds: string[];
};
type Message = {
  id: string;
  title: string;
  body: string;
  senderName: string;
  sentAt: string;
  recipientCount: number;
  readCount: number;
  targeting: Audience;
};
type Person = {
  id: string;
  name: string;
  email: string;
  studentNumber: string | null;
};
const groupOptions = [
  ["enrolled", "Enrolled learners"],
  ["not-enrolled", "Not yet enrolled"],
  ["certified", "Certificate holders"],
  ["in-progress", "Enrolled without a certificate"],
] as const;
export default function AnnouncementManager() {
  const { courses } = useAcademy();
  const [page, setPage] = useState(1),
    [composing, setComposing] = useState(false),
    [title, setTitle] = useState(""),
    [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience["audience"]>("all"),
    [groups, setGroups] = useState<string[]>([]),
    [courseIds, setCourseIds] = useState<string[]>([]),
    [selected, setSelected] = useState<Person[]>([]);
  const [search, setSearch] = useState(""),
    [term, setTerm] = useState(""),
    [learnerPage, setLearnerPage] = useState(1),
    [count, setCount] = useState<number | null>(null),
    [working, setWorking] = useState(false),
    [actionError, setActionError] = useState(""),
    [notice, setNotice] = useState("");
  const { data, loading, error, refresh } = useAdminData<{
    messages: Message[];
    total: number;
    pageSize: number;
  }>("/announcements?page=" + page);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setLearnerPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  function start() {
    setTitle("");
    setBody("");
    setAudience("all");
    setSelected([]);
    setGroups([]);
    setCourseIds([]);
    setActionError("");
    setCount(null);
    setComposing(true);
  }
  const targeting: Audience = {
    audience,
    learnerIds: audience === "selected" ? selected.map((p) => p.id) : [],
    groups: audience === "groups" ? groups : [],
    courseIds: audience === "groups" ? courseIds : [],
  };
  async function preview() {
    setWorking(true);
    setActionError("");
    try {
      const result = await authRequest(
        "/announcements/preview",
        targeting,
        "POST",
        true,
        "/api/admin",
      );
      if (!result.count)
        throw new Error("No active, verified learners match this audience.");
      setCount(result.count);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Unable to check recipients.",
      );
    } finally {
      setWorking(false);
    }
  }
  async function send() {
    if (working) return;
    setWorking(true);
    setActionError("");
    try {
      const result = await authRequest(
        "/announcements",
        { title, body, targeting },
        "POST",
        true,
        "/api/admin",
      );
      setComposing(false);
      setNotice(
        `Announcement sent to ${result.message.recipientCount} learners.`,
      );
      await refresh();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Unable to send announcement.",
      );
    } finally {
      setWorking(false);
    }
  }
  function toggle(
    value: string,
    values: string[],
    set: (values: string[]) => void,
  ) {
    set(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );
  }
  return (
    <div className="people-page announcements-page">
      <header className="people-heading">
        <div>
          <h1>Announcements</h1>
          <p>
            Keep learners informed with updates delivered to their academy
            inbox.
          </p>
        </div>
        <button className="btn" onClick={start}>
          <Plus size={17} />
          New announcement
        </button>
      </header>
      {notice && (
        <div className="certificate-notice" role="status">
          <Megaphone size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>Dismiss</button>
        </div>
      )}
      {error && (
        <div className="editor-validation" role="alert">
          {error}
          <button onClick={() => refresh()}>Try again</button>
        </div>
      )}
      <section className="people-surface">
        <div className="certificate-register-heading">
          <div>
            <h2>Sent announcements</h2>
            <p>See who received your updates and how many have read them.</p>
          </div>
          <span className="pill">{data?.total || 0} sent</span>
        </div>
        {loading && !data ? (
          <div className="empty" role="status">
            <LoaderCircle className="spin" />
            Loading announcements
          </div>
        ) : data?.messages.length ? (
          data.messages.map((m) => (
            <article className="announcement-card" key={m.id}>
              <div className="announcement-meta">
                <span>{new Date(m.sentAt).toLocaleString("en-GB")}</span>
                <span>
                  {m.targeting.audience === "all"
                    ? "All learners"
                    : m.targeting.audience === "selected"
                      ? "Selected learners"
                      : "Learner groups"}
                </span>
              </div>
              <h3>{m.title}</h3>
              <p className="announcement-body">{m.body}</p>
              <div className="announcement-meta">
                <span>Sent by {m.senderName}</span>
                <span>
                  {m.recipientCount} recipients · {m.readCount} read
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            <Megaphone size={32} />
            <h3>No announcements yet</h3>
            <p>
              Send your first update to all learners or a selected audience.
            </p>
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
      {composing && (
        <AccountDialog
          title={count === null ? "New announcement" : "Review announcement"}
          busy={working}
          onClose={() => setComposing(false)}
        >
          <form
            className="announcement-compose"
            onSubmit={(e) => {
              e.preventDefault();
              if (count === null) preview();
              else send();
            }}
          >
            {count === null ? (
              <>
                <label>
                  Title
                  <input
                    required
                    maxLength={160}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your update a clear title"
                  />
                </label>
                <label>
                  Message
                  <textarea
                    required
                    rows={5}
                    maxLength={5000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What do your learners need to know?"
                  />
                </label>
                <label>
                  Send to
                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(e.target.value as Audience["audience"])
                    }
                  >
                    <option value="all">All learners</option>
                    <option value="groups">Learner groups or courses</option>
                    <option value="selected">Selected learners</option>
                  </select>
                </label>
                {audience === "groups" && (
                  <div className="announcement-audiences">
                    <strong>Learner groups</strong>
                    {groupOptions.map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={groups.includes(key)}
                          onChange={() => toggle(key, groups, setGroups)}
                        />
                        {label}
                      </label>
                    ))}
                    <strong>Started a course</strong>
                    <p>
                      Learners active in any selected course. Selections are
                      combined.
                    </p>
                    {courses
                      .filter((c) => c.status === "published")
                      .map((c) => (
                        <label key={c.id}>
                          <input
                            type="checkbox"
                            checked={courseIds.includes(c.id)}
                            onChange={() =>
                              toggle(c.id, courseIds, setCourseIds)
                            }
                          />
                          {c.title}
                        </label>
                      ))}
                  </div>
                )}
                {audience === "selected" && (
                  <>
                    <div className="announcement-chips">
                      {selected.map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() =>
                            setSelected(selected.filter((s) => s.id !== p.id))
                          }
                        >
                          {p.name}
                          <X size={13} />
                        </button>
                      ))}
                    </div>
                    <label className="people-search">
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search learners"
                        aria-label="Search announcement recipients"
                      />
                    </label>
                    <RecipientPicker
                      search={term}
                      page={learnerPage}
                      onPage={setLearnerPage}
                      selected={selected}
                      onSelect={setSelected}
                    />
                  </>
                )}
                <p className="field-hint">
                  Only active learners with verified email addresses receive
                  announcements. Updates appear inside the academy; no email is
                  sent.
                </p>
              </>
            ) : (
              <>
                <p className="account-dialog-description">
                  This announcement will appear in{" "}
                  <strong>{count} learners’</strong> accounts. Group membership
                  is checked again when sending.
                </p>
                <h3>{title}</h3>
                <p className="announcement-body">{body}</p>
              </>
            )}
            {actionError && (
              <div className="editor-validation" role="alert">
                {actionError}
              </div>
            )}
            <div className="account-dialog-actions">
              <button
                type="button"
                className="btn secondary"
                disabled={working}
                onClick={() =>
                  count === null ? setComposing(false) : setCount(null)
                }
              >
                {count === null ? "Cancel" : "Back to edit"}
              </button>
              <button className="btn" disabled={working}>
                {working ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Send size={16} />
                )}{" "}
                {count === null ? "Review & send" : "Send announcement"}
              </button>
            </div>
          </form>
        </AccountDialog>
      )}
    </div>
  );
}
function RecipientPicker({
  search,
  page,
  onPage,
  selected,
  onSelect,
}: {
  search: string;
  page: number;
  onPage: (p: number) => void;
  selected: Person[];
  onSelect: (people: Person[]) => void;
}) {
  const { data, loading, error, refresh } = useAdminData<{
    learners: Person[];
    total: number;
  }>(
    "/learners?" +
      new URLSearchParams({ search, page: String(page), status: "active" }),
  );
  return (
    <div className="announcement-recipient-list">
      {error && (
        <p role="alert">
          {error}
          <button type="button" onClick={() => refresh()}>
            Retry
          </button>
        </p>
      )}
      {loading ? (
        <p>Loading learners…</p>
      ) : (
        data?.learners.map((p) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={selected.some((s) => s.id === p.id)}
              disabled={
                selected.length >= 500 && !selected.some((s) => s.id === p.id)
              }
              onChange={() =>
                onSelect(
                  selected.some((s) => s.id === p.id)
                    ? selected.filter((s) => s.id !== p.id)
                    : [...selected, p],
                )
              }
            />
            <span>
              <strong>{p.name}</strong>
              <small>
                {p.studentNumber} · {p.email}
              </small>
            </span>
          </label>
        ))
      )}
      {!loading && data && !data.total && <p>No learners found.</p>}
      <div className="announcement-recipient-pages">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <span>{selected.length} selected</span>
        <button
          type="button"
          disabled={page * 20 >= (data?.total || 0) || loading}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
