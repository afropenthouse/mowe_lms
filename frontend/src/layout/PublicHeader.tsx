"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui";
import { useAcademy } from "../providers/AcademyProvider";
import ThemeToggle from "../components/ThemeToggle";
import { publicNavigation } from "../lib/publicNavigation";
export default function PublicHeader() {
  const { user, go, enroll, path } = useAcademy();
  return (
    <header className="public-header">
      <Link href="/" className="brand">
        <Image
          width={135}
          height={50}
          sizes="135px"
          src="/mowe-logo.png"
          alt="MOWE Global"
        />
        <span>ACADEMY</span>
      </Link>
      <nav aria-label="Academy">
        {publicNavigation.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        {user ? (
          <button className="text-link" onClick={() => go("/dashboard")}>
            My learning <ArrowUpRight size={17} />
          </button>
        ) : (
          <Link href="/login" className="login">
            Log in
          </Link>
        )}
        <Button onClick={enroll}>
          Start your journey <ArrowUpRight size={17} />
        </Button>
      </div>
    </header>
  );
}
