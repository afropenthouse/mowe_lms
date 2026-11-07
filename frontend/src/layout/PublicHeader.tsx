"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui";
import { useAcademy } from "../providers/AcademyProvider";
import ThemeToggle from "../components/ThemeToggle";
export default function PublicHeader() {
  const { user, go, enroll } = useAcademy();
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
      <nav>
        <Link href="/#program">The program</Link>
        <Link href="/courses">Our courses</Link>
        <Link href="/#approach">How it works</Link>
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
