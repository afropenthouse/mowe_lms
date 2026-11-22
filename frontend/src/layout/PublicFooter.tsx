import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { publicNavigation } from "../lib/publicNavigation";

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div>
        <Link href="/" aria-label="MOWE Academy home">
          <Image
            width={135}
            height={45}
            src="/mowe-logo.png"
            alt="MOWE Global"
          />
        </Link>
        <p>Practical business education from MOWE Global.</p>
      </div>
      <div>
        <strong>Explore the academy</strong>
        {publicNavigation.map(({ href, label }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </div>
      <div>
        <strong>Your learning</strong>
        <Link href="/login">Log in</Link>
        <Link href="/dashboard">Learner dashboard</Link>
        <Link href="/certificates">Your certificates</Link>
      </div>
      <div className="footer-end">
        © {new Date().getFullYear()} MOWE Global.
        <a href="https://moweglobal.com" target="_blank" rel="noreferrer">
          MOWE Global <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
