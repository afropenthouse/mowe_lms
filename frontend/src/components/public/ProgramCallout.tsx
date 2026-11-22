import { ArrowRight } from "lucide-react";
import Link from "next/link";
import PublicFooter from "../../layout/PublicFooter";

export default function ProgramCallout() {
  return (
    <>
      <div className="visitor-wrap">
        <section className="visitor-cta">
          <div>
            <h2>Ready to start learning?</h2>
            <p>Create a learner account to join the CBA program.</p>
          </div>
          <Link href="/signup" className="btn">
            Create an account <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
      <PublicFooter />
    </>
  );
}
