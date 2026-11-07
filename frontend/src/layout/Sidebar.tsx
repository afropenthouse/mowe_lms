"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { useAcademy } from "../providers/AcademyProvider";

export default function Sidebar() {
  const {
    mobile,
    setMobile,
    user,
    go,
    admin,
    nav,
    navAdmin,
    path,
    signOut,
    courses,
  } = useAcademy();
  return (
    <aside className={`sidebar ${mobile ? "open" : ""}`}>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          go("/");
        }}
        className="brand"
      >
        <Image
          width={135}
          height={50}
          sizes="135px"
          src="/mowe-logo.png"
          alt="MOWE Global"
        />
        <span>ACADEMY</span>
      </a>
      <div className="sidebar-scroll">
        <div className="workspace-label">
          {admin ? "ADMINISTRATION" : "YOUR LEARNING SPACE"}
        </div>
        <nav>
          {(admin ? navAdmin : nav)
            .filter(([p]) => p !== "/admin/team" || user?.isSuperAdmin)
            .map(([p, label, Icon]) => (
              <Link
                key={p}
                href={p}
                onClick={() => setMobile(false)}
                className={
                  path === p || (p !== "/admin" && path.startsWith(`${p}/`))
                    ? "active"
                    : ""
                }
                aria-current={
                  path === p || (p !== "/admin" && path.startsWith(`${p}/`))
                    ? "page"
                    : undefined
                }
              >
                <Icon size={20} />
                {label}
                {p === "/courses" && (
                  <span className="nav-count">{courses.length}</span>
                )}
              </Link>
            ))}
        </nav>
        {!admin && (
          <details className="sidebar-promo">
            <summary>
              <strong>Your next chapter starts here.</strong>
              <ChevronDown size={15} aria-hidden="true" />
            </summary>
            <p>One lesson. One new possibility.</p>
          </details>
        )}
      </div>

      <div className="sidebar-bottom">
        <div className="side-profile">
          <Link
            href={user?.role === "admin" ? "/admin/profile" : "/profile"}
            className="avatar profile-avatar-link"
            aria-label="Open your profile"
            onClick={() => setMobile(false)}
          >
            {user?.profile?.photo ? (
              <img src={user.profile.photo} alt="" />
            ) : (
              user?.name?.[0]?.toUpperCase() || "M"
            )}
          </Link>
          <div>
            <Link
              href={user?.role === "admin" ? "/admin/profile" : "/profile"}
              onClick={() => setMobile(false)}
            >
              <strong>{user?.name || "Your account"}</strong>
            </Link>
            <small>
              {user?.role === "admin"
                ? user.isSuperAdmin
                  ? "Super Admin"
                  : "Administrator"
                : user?.studentNumber || "CBA learner"}
            </small>
          </div>
          {user && (
            <button type="button" className="sidebar-logout" onClick={signOut}>
              <LogOut size={15} aria-hidden="true" />
              Log out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
