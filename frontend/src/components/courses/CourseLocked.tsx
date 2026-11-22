import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export function LockedBadge() {
  return (
    <span className="course-lock-badge">
      <Lock size={14} aria-hidden="true" /> Locked
    </span>
  );
}

export function CoursePaymentRequired({ title }: { title: string }) {
  return (
    <section className="course-locked-notice">
      <span className="course-lock-badge">Payment required</span>
      <h1>{title}</h1>
      <p>Choose a payment option to unlock this course.</p>
      <Link href="/payments" className="btn">
        View payment options <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </section>
  );
}

export default function CourseLocked({
  title,
  prerequisite,
  continueTo,
}: {
  title: string;
  prerequisite: string;
  continueTo: string;
}) {
  return (
    <section
      className="course-locked-notice"
      aria-labelledby="course-locked-title"
    >
      <LockedBadge />
      <h1 id="course-locked-title">{title}</h1>
      <p>
        Each course unlocks the next. Complete <strong>{prerequisite}</strong>{" "}
        before moving on.
      </p>
      <Link href={continueTo} className="btn">
        Return to your learning <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </section>
  );
}
