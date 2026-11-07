"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Download,
  LoaderCircle,
  Search,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import { authRequest } from "../../lib/auth";
import { useAdminData } from "../../lib/useAdminData";
import AccountDialog from "./AccountDialog";
import { useAcademy } from "../../providers/AcademyProvider";

type Learner = {
  id: string;
  name: string;
  email: string;
  studentNumber: string | null;
  createdAt: string;
  status: "active" | "suspended" | "pending";
  suspendedAt: string | null;
  suspensionReason: string;
  enrolledAt: string | null;
  completedLessons: number;
  quizAverage: number | null;
  gradedAttempts: number;
};
type Directory = {
  learners: Learner[];
  total: number;
  page: number;
  pageSize: number;
  totalLessons: number;
};
const statusText = {
  active: "Active",
  pending: "Unverified",
  suspended: "Suspended",
};
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export default function LearnerDirectory() {
  const { user } = useAcademy();
  const [search, setSearch] = useState(""),
    [term, setTerm] = useState(""),
    [status, setStatus] = useState("all"),
    [enrollment, setEnrollment] = useState("all"),
    [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Learner | null>(null),
    [managing, setManaging] = useState<Learner | null>(null),
    [reason, setReason] = useState(""),
    [working, setWorking] = useState(false),
    [actionError, setActionError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const params = new URLSearchParams({
    search: term,
    status,
    enrollment,
    page: String(page),
  });
  const { data, loading, error, refresh } = useAdminData<Directory>(
    "/learners?" + params.toString(),
  );
  const pageCount = Math.max(
    1,
    Math.ceil((data?.total || 0) / (data?.pageSize || 20)),
  );
  useEffect(() => {
    if (data && page > pageCount) setPage(pageCount);
  }, [data, page, pageCount]);
  function openStatus(learner: Learner) {
    setManaging(learner);
    setReason("");
    setActionError("");
  }
  async function updateStatus() {
    if (!managing) return;
    setWorking(true);
    setActionError("");
    try {
      const result = await authRequest(
        "/learners/" + managing.id + "/status",
        {
          status: managing.status === "suspended" ? "active" : "suspended",
          reason,
        },
        "PATCH",
        true,
        "/api/admin",
      );
      await refresh();
      setManaging(null);
      setMessage(result.message);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Unable to update this account.",
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="people-page">
      <div className="library-breadcrumb">
        <Link href="/admin">Academy</Link>
        <span>/</span>
        <span>Learners</span>
      </div>
      <header className="people-heading">
        <div>
          <h1>Learners</h1>
          <p>
            Manage learner access and follow their progress through the
            programme.
          </p>
        </div>
        <div className="people-heading-actions">
          <a
            className="people-secondary"
            href={"/api/admin/learners/export?" + params.toString()}
          >
            <Download size={16} />
            Export CSV
          </a>
          {user?.isSuperAdmin && (
            <Link className="library-primary" href="/admin/team#invite">
              <UserRoundPlus size={17} />
              Invite administrator
            </Link>
          )}
        </div>
      </header>
      {message && (
        <div className="people-notice" role="status">
          <CheckCircle2 size={17} />
          <span>{message}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <section className="people-surface" aria-label="Learner directory">
        <div className="people-toolbar">
          <label className="people-search">
            <Search size={17} />
            <input
              aria-label="Search learners"
              placeholder="Search name, email or student number"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <div className="people-filter-controls">
            <select
              aria-label="Account status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All account statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Unverified</option>
            </select>
            <select
              aria-label="Enrollment"
              value={enrollment}
              onChange={(e) => {
                setEnrollment(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All enrollments</option>
              <option value="enrolled">Enrolled</option>
              <option value="not-enrolled">Not enrolled</option>
            </select>
          </div>
        </div>
        {error && data && (
          <div className="people-notice" role="alert">
            <span>Unable to refresh. Showing the last loaded results.</span>
            <button className="people-secondary" onClick={() => refresh()}>
              Try again
            </button>
          </div>
        )}
        {error && !data ? (
          <div className="people-empty" role="alert">
            <h2>Unable to load learners</h2>
            <p>{error}</p>
            <button className="people-secondary" onClick={() => refresh()}>
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="people-empty" role="status">
            <LoaderCircle size={25} className="spin" />
            <p>Loading learners…</p>
          </div>
        ) : data?.learners.length ? (
          <>
            <div className="people-table-scroll">
              <table className="people-table">
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th>Account</th>
                    <th>Enrollment</th>
                    <th>Programme progress</th>
                    <th>Quiz average</th>
                    <th>
                      <span className="library-sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.learners.map((learner) => {
                    const percent = data.totalLessons
                      ? Math.min(
                          100,
                          Math.round(
                            (learner.completedLessons / data.totalLessons) *
                              100,
                          ),
                        )
                      : 0;
                    return (
                      <tr key={learner.id}>
                        <td>
                          <button
                            className="people-person"
                            onClick={() => setSelected(learner)}
                          >
                            <span className="people-initial">
                              {learner.name[0]?.toUpperCase() || "M"}
                            </span>
                            <span>
                              <strong>{learner.name}</strong>
                              <span>{learner.email}</span>
                              <small>{learner.studentNumber}</small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span className={"people-status " + learner.status}>
                            <i />
                            {statusText[learner.status]}
                          </span>
                        </td>
                        <td>
                          <span className="people-enrollment">
                            {learner.enrolledAt ? "Enrolled" : "Not enrolled"}
                          </span>
                          <small>
                            {learner.enrolledAt ? date(learner.enrolledAt) : ""}
                          </small>
                        </td>
                        <td>
                          <div className="people-progress">
                            <div>
                              <span>
                                {learner.completedLessons} / {data.totalLessons}{" "}
                                lessons
                              </span>
                              <strong>{percent}%</strong>
                            </div>
                            <div className="people-progress-track">
                              <i style={{ width: percent + "%" }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className="people-average">
                            {learner.quizAverage === null
                              ? "—"
                              : learner.quizAverage + "%"}
                          </strong>
                          <small>
                            {learner.gradedAttempts
                              ? learner.gradedAttempts + " graded"
                              : "No graded quizzes"}
                          </small>
                        </td>
                        <td>
                          <div className="people-row-actions">
                            <button onClick={() => setSelected(learner)}>
                              View learner
                            </button>
                            <button
                              className={
                                learner.status === "suspended"
                                  ? "people-reactivate"
                                  : "people-suspend"
                              }
                              onClick={() => openStatus(learner)}
                            >
                              {learner.status === "suspended"
                                ? "Reactivate"
                                : "Suspend"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="people-pagination">
              <span>
                Showing {(page - 1) * data.pageSize + 1}–
                {Math.min(page * data.pageSize, data.total)} of {data.total}{" "}
                learners
              </span>
              <div>
                <button
                  className="people-page-button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ArrowLeft size={16} />
                </button>
                <span>
                  Page {page} of {pageCount}
                </span>
                <button
                  className="people-page-button"
                  aria-label="Next page"
                  disabled={page >= pageCount}
                  onClick={() => setPage(page + 1)}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="people-empty">
            <Users size={29} />
            <h2>
              {term || status !== "all" || enrollment !== "all"
                ? "No matching learners"
                : "No learners yet"}
            </h2>
            <p>
              {term || status !== "all" || enrollment !== "all"
                ? "Try a different search or account filter."
                : "Learners will appear here when they sign up."}
            </p>
            <button
              className="people-secondary"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setEnrollment("all");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
      {selected && (
        <AccountDialog
          title="Learner details"
          onClose={() => setSelected(null)}
        >
          <div className="people-detail-heading">
            <span className="people-initial">
              {selected.name[0]?.toUpperCase()}
            </span>
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.studentNumber}</p>
            </div>
            <span className={"people-status " + selected.status}>
              {statusText[selected.status]}
            </span>
          </div>
          <dl className="people-detail-list">
            <div>
              <dt>Email address</dt>
              <dd>
                <a href={"mailto:" + selected.email}>{selected.email}</a>
              </dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{date(selected.createdAt)}</dd>
            </div>
            <div>
              <dt>Enrollment</dt>
              <dd>
                {selected.enrolledAt
                  ? "Enrolled on " + date(selected.enrolledAt)
                  : "Not enrolled"}
              </dd>
            </div>
            <div>
              <dt>Completed lessons</dt>
              <dd>
                {selected.completedLessons} of {data?.totalLessons || 0}
              </dd>
            </div>
            <div>
              <dt>Quiz average</dt>
              <dd>
                {selected.quizAverage === null
                  ? "No graded quizzes"
                  : selected.quizAverage + "%"}
              </dd>
            </div>
            {selected.suspendedAt && (
              <div>
                <dt>Suspension reason</dt>
                <dd>{selected.suspensionReason}</dd>
              </div>
            )}
          </dl>
          <div className="account-dialog-actions">
            <button
              className="people-secondary"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
            <button
              className={
                selected.status === "suspended"
                  ? "library-primary"
                  : "people-danger-button"
              }
              onClick={() => {
                setSelected(null);
                openStatus(selected);
              }}
            >
              {selected.status === "suspended"
                ? "Reactivate account"
                : "Suspend account"}
            </button>
          </div>
        </AccountDialog>
      )}
      {managing && (
        <AccountDialog
          title={
            managing.status === "suspended"
              ? "Reactivate learner"
              : "Suspend learner"
          }
          onClose={() => setManaging(null)}
          busy={working}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateStatus();
            }}
          >
            <p className="account-dialog-description">
              {managing.status === "suspended"
                ? `Restore access for ${managing.name}. They will be able to sign in and continue learning.`
                : `Suspend access for ${managing.name}. Their current sessions will end and their learning records will be kept.`}
            </p>
            {managing.status !== "suspended" && (
              <label className="people-reason">
                Reason for suspension
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  placeholder="Explain why access is being suspended"
                  disabled={working}
                />
              </label>
            )}
            {actionError && (
              <p className="feedback error" role="alert">
                {actionError}
              </p>
            )}
            <div className="account-dialog-actions">
              <button
                type="button"
                className="people-secondary"
                disabled={working}
                onClick={() => setManaging(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={working}
                className={
                  managing.status === "suspended"
                    ? "library-primary"
                    : "people-danger-button"
                }
              >
                {working ? (
                  <LoaderCircle size={16} className="spin" />
                ) : managing.status === "suspended" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Ban size={16} />
                )}{" "}
                {managing.status === "suspended"
                  ? "Reactivate learner"
                  : "Suspend learner"}
              </button>
            </div>
          </form>
        </AccountDialog>
      )}
    </div>
  );
}
