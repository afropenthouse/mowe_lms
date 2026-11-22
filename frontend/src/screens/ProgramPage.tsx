import {
  ArrowRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProgramCallout from "../components/public/ProgramCallout";

const outcomes = [
  {
    icon: BriefcaseBusiness,
    title: "Understand how a business operates",
    description:
      "See how business structures, teams, and governance shape everyday decisions.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Use financial information with confidence",
    description:
      "Read financial statements, build a budget, and explain where costs or cash flow need attention.",
  },
  {
    icon: Users,
    title: "Build stronger customer relationships",
    description:
      "Identify the customers you serve, choose how to reach them, and plan how to keep them.",
  },
];

export default function ProgramPage() {
  return (
    <div className="visitor-page">
      <div className="visitor-wrap">
        <section className="visitor-program-hero">
          <div className="visitor-hero-copy">
            <span className="visitor-label">THE CBA PROGRAM</span>
            <h1>Certified Business Administrator</h1>
            <p>
              Build the business skills to take on more responsibility at work,
              from reading a budget to improving how teams serve customers.
            </p>
            <Link className="btn" href="/courses">
              Explore the courses <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <figure>
            <Image
              src="/workshop.jpg"
              alt="Professionals learning together at a MOWE Global workshop"
              fill
              sizes="(max-width: 760px) 90vw, (max-width: 1250px) 44vw, 530px"
              fetchPriority="high"
            />
            <figcaption>MOWE GLOBAL WORKSHOP</figcaption>
          </figure>
        </section>
        <section className="visitor-program-content">
          <div>
            <span className="visitor-label">WHO IT’S FOR</span>
            <h2>Early in your career and ready for more?</h2>
            <p>
              The program is designed for professionals with two to five years
              of experience who want to understand how the wider business works.
            </p>
            <p>
              Work through lessons at your own pace, practise with workplace
              cases, and apply what you learn in course assignments.
            </p>
            <Link className="text-link" href="/how-it-works">
              See how learning works <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="visitor-outcomes">
            <h2>What you’ll learn</h2>
            {outcomes.map(({ icon: Icon, title, description }) => (
              <div key={title}>
                <Icon size={22} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <ProgramCallout />
    </div>
  );
}
