"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import AdminInvite from "../components/auth/AdminInvite";
import { authRequest } from "../lib/auth";
import { useAdminData } from "../lib/useAdminData";
import AccountDialog from "../components/admin/AccountDialog";
type Team = {
  admins: {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerifiedAt: string | null;
    createdAt: string;
    suspendedAt: string | null;
  }[];
  total: number;
  page: number;
  pageSize: number;
  canManageAdministrators: boolean;
  invitations: {
    id: string;
    email: string;
    createdAt: string;
    expiresAt: string;
  }[];
};
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export default function AdminTeamPage() {
  const [page, setPage] = useState(1),
    [state, setState] = useState("active"),
    [managing, setManaging] = useState<Team["admins"][number] | null>(null),
    [actionError, setActionError] = useState(""),
    [working, setWorking] = useState(""),
    [message, setMessage] = useState("");
  const { data, error, loading, refresh } = useAdminData<Team>(
    "/team?page=" + page + "&state=" + state,
  );
  const pageCount = Math.max(
    1,
    Math.ceil((data?.total || 0) / (data?.pageSize || 20)),
  );
  useEffect(() => {
    if (data && page > pageCount) setPage(pageCount);
  }, [data, page, pageCount]);
  async function updateAccess() {
    if (!managing) return;
    setWorking(managing.id);
    setActionError("");
    try {
      const result = await authRequest(
        "/team/" + managing.id + "/access",
        { active: !!managing.suspendedAt },
        "PATCH",
        true,
        "/api/admin",
      );
      await refresh();
      setManaging(null);
      setMessage(result.message);
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : "Unable to update administrator access.",
      );
    } finally {
      setWorking("");
    }
  }
  async function revoke(id: string, email: string) {
    if (!window.confirm("Revoke the pending invitation for " + email + "?"))
      return;
    setWorking(id);
    setMessage("");
    try {
      const result = await authRequest(
        "/invitations/" + id,
        {},
        "DELETE",
        true,
        "/api/admin",
      );
      setMessage(result.message);
      await refresh();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to revoke invitation.",
      );
    } finally {
      setWorking("");
    }
  }
  return (
    <div className="people-page team-page">
      <div className="library-breadcrumb">
        <Link href="/admin">Academy</Link>
        <span>/</span>
        <span>Administrators</span>
      </div>
      <header className="people-heading">
        <div>
          <h1>Administrators</h1>
          <p>
            Super Admin manages team access. Administrators manage courses and
            learners.
          </p>
        </div>
        <Link className="people-secondary" href="/admin/students">
          <ArrowLeft size={16} />
          Learners
        </Link>
      </header>
      {message && (
        <p className="people-notice" role="status">
          {message}
        </p>
      )}
      <div
        className="team-filters"
        role="group"
        aria-label="Administrator access filter"
      >
        {[
          ["active", "Current administrators"],
          ["removed", "Removed administrators"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={state === value}
            className={state === value ? "active" : ""}
            onClick={() => {
              setState(value);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
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
          <p>{error}</p>
          <button className="people-secondary" onClick={() => refresh()}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="people-empty" role="status">
          <LoaderCircle className="spin" size={24} />
          <p>Loading administrators…</p>
        </div>
      ) : (
        data && (
          <>
            <section
              className="people-surface"
              aria-label="Administrator accounts"
            >
              <header className="people-section-heading">
                <h2>Administrator accounts</h2>
                <span>
                  {data.total} {data.total === 1 ? "account" : "accounts"}
                </span>
              </header>
              <div className="people-table-scroll">
                <table className="people-table">
                  <thead>
                    <tr>
                      <th>Administrator</th>
                      <th>Access</th>
                      <th>Status</th>
                      <th>Joined</th>
                      {data.canManageAdministrators && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.admins.map((admin) => (
                      <tr key={admin.id}>
                        <td>
                          <div className="people-person">
                            <span className="people-initial">
                              <ShieldCheck size={21} />
                            </span>
                            <span>
                              <strong>{admin.name}</strong>
                              <span>{admin.email}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          {admin.role === "SUPERADMIN"
                            ? "Super Admin"
                            : "Administrator"}
                        </td>
                        <td>
                          <span
                            className={
                              "people-status " +
                              (admin.suspendedAt
                                ? "suspended"
                                : admin.emailVerifiedAt
                                  ? "active"
                                  : "pending")
                            }
                          >
                            <i />
                            {admin.suspendedAt
                              ? "Removed"
                              : admin.emailVerifiedAt
                                ? "Active"
                                : "Awaiting verification"}
                          </span>
                        </td>
                        <td>{date(admin.createdAt)}</td>
                        {data.canManageAdministrators && (
                          <td>
                            {admin.role === "SUPERADMIN" ? (
                              <span className="people-owner-label">
                                Owner account
                              </span>
                            ) : (
                              <button
                                className={
                                  admin.suspendedAt
                                    ? "people-reactivate"
                                    : "people-suspend"
                                }
                                disabled={!!working}
                                onClick={() => {
                                  setManaging(admin);
                                  setActionError("");
                                }}
                              >
                                {admin.suspendedAt
                                  ? "Restore access"
                                  : "Remove admin"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!data.admins.length && (
                <div className="people-empty">
                  <h2>No removed administrators</h2>
                  <p>
                    Removed administrators will appear here so access can be
                    restored if needed.
                  </p>
                </div>
              )}
              {data.total > data.pageSize && (
                <footer className="people-pagination">
                  <span>
                    Page {page} of {Math.ceil(data.total / data.pageSize)}
                  </span>
                  <div>
                    <button
                      className="people-page-button"
                      aria-label="Previous administrators page"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      className="people-page-button"
                      aria-label="Next administrators page"
                      disabled={page * data.pageSize >= data.total}
                      onClick={() => setPage(page + 1)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </footer>
              )}
            </section>
            {data.invitations.length > 0 && (
              <section
                className="people-surface"
                aria-label="Pending administrator invitations"
              >
                <header className="people-section-heading">
                  <h2>Pending invitations</h2>
                  <p>Invitations expire after seven days.</p>
                </header>
                <div className="people-table-scroll">
                  <table className="people-table">
                    <thead>
                      <tr>
                        <th>Email address</th>
                        <th>Invited</th>
                        <th>Expires</th>
                        {data.canManageAdministrators && (
                          <th>
                            <span className="library-sr-only">Actions</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.invitations.map((invite) => (
                        <tr key={invite.id}>
                          <td>{invite.email}</td>
                          <td>{date(invite.createdAt)}</td>
                          <td>{date(invite.expiresAt)}</td>
                          {data.canManageAdministrators && (
                            <td>
                              <button
                                className="people-suspend"
                                disabled={!!working}
                                onClick={() => revoke(invite.id, invite.email)}
                              >
                                {working === invite.id ? (
                                  <LoaderCircle size={15} className="spin" />
                                ) : (
                                  "Revoke invitation"
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )
      )}
      {data?.canManageAdministrators && (
        <section id="invite" className="team-invite">
          <AdminInvite onInvited={() => refresh()} />
        </section>
      )}
      {data && !data.canManageAdministrators && (
        <p className="team-permission-note">
          Contact the Super Admin to invite or remove administrators.
        </p>
      )}
      {managing && (
        <AccountDialog
          title={
            managing.suspendedAt
              ? "Restore administrator access"
              : "Remove administrator"
          }
          onClose={() => setManaging(null)}
          busy={!!working}
        >
          <p className="account-dialog-description">
            {managing.suspendedAt
              ? `Restore administrator access for ${managing.name}? They will be able to sign in and manage the academy again.`
              : `Remove administrator access for ${managing.name} (${managing.email})? Their sessions will end immediately. Access can be restored from Removed administrators.`}
          </p>
          {actionError && (
            <p role="alert" className="feedback error">
              {actionError}
            </p>
          )}
          <div className="account-dialog-actions">
            <button
              type="button"
              className="people-secondary"
              disabled={!!working}
              onClick={() => setManaging(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={
                managing.suspendedAt
                  ? "library-primary"
                  : "people-danger-button"
              }
              disabled={!!working}
              onClick={updateAccess}
            >
              {working && <LoaderCircle size={16} className="spin" />}
              {managing.suspendedAt ? "Restore access" : "Remove admin"}
            </button>
          </div>
        </AccountDialog>
      )}
    </div>
  );
}
