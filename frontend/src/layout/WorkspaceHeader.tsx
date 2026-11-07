"use client";
import { Menu } from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { useAcademy } from "../providers/AcademyProvider";
import ThemeToggle from "../components/ThemeToggle";
import Link from "next/link";

export default function WorkspaceHeader() {
  const { mobile, setMobile, user, admin } = useAcademy();
  return (
    <header className="app-header">
      <button
        className="mobile-menu icon-btn"
        aria-label="Open navigation"
        aria-expanded={mobile}
        onClick={() => setMobile(!mobile)}
      >
        <Menu />
      </button>
      <span>
        {admin
          ? "Academy management"
          : "Learn with purpose. Grow with confidence."}
      </span>
      <div>
        <ThemeToggle />
        {!admin && <NotificationBell />}
        <Link
          href={user?.role === "admin" ? "/admin/profile" : "/profile"}
          className="avatar profile-avatar-link"
          aria-label="Open your profile"
        >
          {user?.profile?.photo ? (
            <img src={user.profile.photo} alt="" />
          ) : (
            user?.name?.[0]?.toUpperCase() || "M"
          )}
        </Link>
      </div>
    </header>
  );
}
