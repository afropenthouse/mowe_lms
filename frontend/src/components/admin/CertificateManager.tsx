"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  Check,
  LoaderCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { authRequest } from "../../lib/auth";
import { useAdminData } from "../../lib/useAdminData";
import AccountDialog from "./AccountDialog";
type Settings = {
  enabled: boolean;
  programName: string;
  issuer: string;
  signatoryName: string;
  signatoryTitle: string;
  requireAssignments: boolean;
  requireFinalAssessment: boolean;
};
type Learner = {
  id: string;
  name: string;
  email: string;
  studentNumber: string | null;
  completedLessons: number;
  totalLessons: number;
  passedQuizzes: number;
  totalQuizzes: number;
  gradedAssignments: number;
  totalAssignments: number;
  finalPassed: boolean;
  status: "eligible" | "issued" | "in-progress";
  certificateId: string | null;
  issuedAt: string | null;
};
type Register = {
  settings: Settings;
  learners: Learner[];
  total: number;
  page: number;
  pageSize: number;
  summary: { issued: number; eligible: number; inProgress: number };
};
export default function CertificateManager() {
  const [search, setSearch] = useState(""),
    [term, setTerm] = useState(""),
    [status, setStatus] = useState("all"),
    [page, setPage] = useState(1);
  const [settings, setSettings] = useState<Settings | null>(null),
    [selected, setSelected] = useState<Learner | null>(null),
    [working, setWorking] = useState(false),
    [actionError, setActionError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, loading, error, refresh } = useAdminData<Register>(
    "/certificates?" +
      new URLSearchParams({ search: term, status, page: String(page) }),
  );
  const pageCount = Math.max(1, Math.ceil((data?.total || 0) / 20));
  useEffect(() => {
    if (data && page > pageCount) setPage(pageCount);
  }, [data, page, pageCount]);
  async function submit() {
    if (working) return;
    setWorking(true);
    setActionError("");
    try {
      if (settings) {
        await authRequest(
          "/certificates/settings",
          settings,
          "PATCH",
          true,
          "/api/admin",
        );
        setSettings(null);
        setNotice(
          "Certificate settings saved. Already issued certificates keep their original details.",
        );
      } else if (selected) {
        await authRequest(
          "/certificates/issue",
          { userId: selected.id },
          "POST",
          true,
          "/api/admin",
        );
        setNotice(
          `Certificate issued to ${selected.name}. It is available in their learner account.`,
        );
        setSelected(null);
      }
      await refresh();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Unable to complete this request.",
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="people-page certificate-admin">
      <header className="people-heading">
        <div>
          <h1>Certificates</h1>
          <p>
            Recognize completion and keep a record of every credential issued.
          </p>
        </div>
        <button
          className="people-secondary"
          disabled={!data}
          onClick={() => {
            setActionError("");
            setSettings({ ...data!.settings });
          }}
        >
          <SlidersHorizontal size={16} /> Certificate settings
        </button>
      </header>
      <div className="certificate-stats">
        <div>
          <span>Certificates issued</span>
          <strong>{data?.summary.issued ?? "—"}</strong>
        </div>
        <div>
          <span>Ready to receive</span>
          <strong>{data?.summary.eligible ?? "—"}</strong>
        </div>
        <div>
          <span>Learning in progress</span>
          <strong>{data?.summary.inProgress ?? "—"}</strong>
        </div>
        <div>
          <span>Certificate fee</span>
          <strong>Free</strong>
          <small>No payment required</small>
        </div>
      </div>
      {notice && (
        <div className="certificate-notice" role="status">
          <Check size={18} />
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss confirmation"
          >
            Dismiss
          </button>
        </div>
      )}
      {data && !data.settings.enabled && (
        <div className="editor-validation" role="status">
          Issuance is paused. Existing certificates remain available and
          verifiable.
        </div>
      )}
      {error && (
        <div className="editor-validation" role="alert">
          {error} <button onClick={() => refresh()}>Try again</button>
        </div>
      )}
      <section className="people-surface" aria-label="Completion register">
        <div className="certificate-register-heading">
          <div>
            <h2>Completion register</h2>
            <p>
              Enrolled learners, completion requirements and issued
              certificates.
            </p>
          </div>
          <span className="status published">Free certificates</span>
        </div>
        <div className="people-toolbar">
          <label className="library-search">
            <Search size={17} />
            <input
              aria-label="Search certificate learners"
              placeholder="Search name, email or student number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter certificates"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All enrolled learners</option>
            <option value="eligible">Ready to issue</option>
            <option value="issued">Certificate issued</option>
            <option value="in-progress">In progress</option>
          </select>
        </div>
        {loading && !data ? (
          <div className="empty" role="status">
            <LoaderCircle className="spin" size={24} />
            Loading completion register
          </div>
        ) : (
          data && (
            <>
              <div className="table-wrap">
                <table className="certificate-register">
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Requirements</th>
                      <th>Status</th>
                      <th>Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.learners.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <strong>{l.name}</strong>
                          <small>
                            {l.studentNumber || "Learner"} · {l.email}
                          </small>
                        </td>
                        <td>
                          <span>
                            {l.completedLessons}/{l.totalLessons} lessons ·{" "}
                            {l.passedQuizzes}/{l.totalQuizzes} quizzes
                          </span>
                          {data.settings.requireAssignments && (
                            <small>
                              {l.gradedAssignments}/{l.totalAssignments}{" "}
                              assignments graded
                            </small>
                          )}
                          {data.settings.requireFinalAssessment && (
                            <small>
                              Final assessment:{" "}
                              {l.finalPassed ? "Passed" : "Pending"}
                            </small>
                          )}
                        </td>
                        <td>
                          <span
                            className={`library-status ${l.status === "in-progress" ? "draft" : "published"}`}
                          >
                            {l.status === "issued"
                              ? "Issued"
                              : l.status === "eligible"
                                ? "Ready to issue"
                                : "In progress"}
                          </span>
                        </td>
                        <td>
                          {l.certificateId ? (
                            <>
                              <Link
                                className="text-link"
                                href={`/verify/${l.certificateId}`}
                                target="_blank"
                              >
                                View certificate
                              </Link>
                              <small>
                                Issued{" "}
                                {new Date(l.issuedAt!).toLocaleDateString(
                                  "en-GB",
                                )}
                              </small>
                            </>
                          ) : l.status === "eligible" ? (
                            <button
                              className="people-secondary"
                              disabled={!data.settings.enabled || working}
                              onClick={() => {
                                setSelected(l);
                                setActionError("");
                              }}
                            >
                              <Award size={15} />
                              Issue certificate
                            </button>
                          ) : (
                            <span className="field-hint">
                              Awaiting completion
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!data.learners.length && (
                <div className="empty">
                  <Award size={30} />
                  <h3>No learners found</h3>
                  <p>
                    Completed learners and issued certificates will appear here.
                  </p>
                </div>
              )}
              <div className="certificate-pagination">
                <span>
                  {data.total} learners · Page {page} of {pageCount}
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
                    disabled={page >= pageCount || loading}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )
        )}
      </section>
      {(settings || selected) && (
        <AccountDialog
          title={settings ? "Certificate settings" : "Issue certificate"}
          busy={working}
          onClose={() => {
            setSettings(null);
            setSelected(null);
          }}
        >
          <form
            className="certificate-settings"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {settings ? (
              <>
                <p className="account-dialog-description">
                  Certificates are free. These details apply to newly issued
                  certificates.
                </p>
                {(
                  [
                    ["programName", "Program name"],
                    ["issuer", "Issuing organization"],
                    ["signatoryName", "Signatory name (optional)"],
                    ["signatoryTitle", "Signatory title"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      value={settings[key]}
                      required={key === "programName" || key === "issuer"}
                      maxLength={
                        key === "programName" || key === "issuer" ? 200 : 120
                      }
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <div className="certificate-rules">
                  <strong>Completion requirements</strong>
                  <p>
                    Every lesson in the published courses must be completed and
                    every course quiz passed.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.requireAssignments}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          requireAssignments: e.target.checked,
                        })
                      }
                    />
                    Require graded assignments
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.requireFinalAssessment}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          requireFinalAssessment: e.target.checked,
                        })
                      }
                    />
                    Require final assessment (70% pass mark)
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) =>
                        setSettings({ ...settings, enabled: e.target.checked })
                      }
                    />
                    Allow certificate issuance
                  </label>
                </div>
              </>
            ) : (
              <>
                <p className="account-dialog-description">
                  Issue a free certificate of completion to{" "}
                  <strong>{selected?.name}</strong>? Their completion
                  requirements will be checked again before issuing.
                </p>
                <p>
                  The certificate will appear in their learner account with a
                  public verification link.
                </p>
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
                onClick={() => {
                  setSettings(null);
                  setSelected(null);
                }}
              >
                Cancel
              </button>
              <button className="btn" type="submit" disabled={working}>
                {working && <LoaderCircle size={17} className="spin" />}
                {settings ? "Save settings" : "Issue certificate"}
              </button>
            </div>
          </form>
        </AccountDialog>
      )}
    </div>
  );
}
