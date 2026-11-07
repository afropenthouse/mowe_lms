import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>This page has moved.</h1>
      <p>Find your next step in the CBA curriculum.</p>
      <Link className="btn" href="/courses">
        Explore courses
      </Link>
    </div>
  );
}
