"use client";

import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Clock,
  GraduationCap,
  Play,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import CourseCard from "../components/courses/CourseCard";
import { Button } from "../components/ui";

import { useAcademy } from "../providers/AcademyProvider";

export default function LandingPage() {
  const { data, saved, courses, completed, go, enroll, toggleSaved } =
    useAcademy();
  return (
    <>
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> THE CERTIFIED BUSINESS ADMINISTRATOR PROGRAM
          </div>
          <h1>
            You have ambition.
            <br />
            Build the skills
            <br />
            to <em>go further.</em>
            <svg viewBox="0 0 380 18" aria-hidden="true">
              <path d="M3 13 Q180 -8 376 9" />
            </svg>
          </h1>
          <p>
            The practical business education for your next chapter. Turn what
            you know into what you can do — and build a career with purpose.
          </p>
          <div className="hero-actions">
            <Button onClick={enroll}>
              Explore your potential <ArrowUpRight size={19} />
            </Button>
            <button
              className="hero-preview"
              onClick={() =>
                document
                  .getElementById("program")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span>
                <Play size={14} fill="currentColor" />
              </span>
              Discover the program
            </button>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars">
              <Image
                width={34}
                height={34}
                sizes="135px"
                src="/student-learning.jpg"
                alt=""
              />
              <span aria-hidden="true">TA</span>
              <span>YOU</span>
            </div>
            <div>
              <strong>Built for your next move.</strong>
              <small>For professionals with 2–5 years of experience</small>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="image-frame">
            <Image
              sizes="(max-width: 760px) 90vw, 42vw"
              src="/student-learning.jpg"
              alt="A Black student with glasses taking notes in a bright learning space"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              width={1000}
              height={1500}
            />
            <div className="photo-caption">
              <span>THE FUTURE IS YOURS TO BUILD</span>
              <ArrowUpRight size={28} />
            </div>
          </div>
          <div className="floating-note note-top">
            <span className="red-icon">
              <GraduationCap size={24} />
            </span>
            <div>
              <strong>More than a certificate.</strong>
              <small>Confidence you can put to work.</small>
            </div>
          </div>
          <div className="floating-note note-bottom">
            <span className="green-icon">
              <ChartNoAxesCombined size={22} />
            </span>
            <div>
              <strong>Your next chapter</strong>
              <small>Starts with one decision.</small>
            </div>
            <span className="note-spark">✦</span>
          </div>
          <span className="visual-star">✳</span>
        </div>
      </section>
      <section className="program-strip">
        <div>
          <BookOpen />
          <strong>8 focused courses</strong>
          <span>A complete business foundation</span>
        </div>
        <div>
          <BriefcaseBusiness />
          <strong>Practical, real-world skills</strong>
          <span>Learn it. Apply it. Own it.</span>
        </div>
        <div>
          <Clock />
          <strong>Learn around your life</strong>
          <span>Your pace. Your next step.</span>
        </div>
        <div>
          <Award />
          <strong>One meaningful credential</strong>
          <span>Certified Business Administrator</span>
        </div>
      </section>
      <section className="section program-section" id="program">
        <div className="section-heading">
          <div>
            <div className="eyebrow red">
              A STRONGER FOUNDATION. A BIGGER FUTURE.
            </div>
            <h2>
              Business skills.
              <br />
              Career-changing possibilities.
            </h2>
          </div>
          <p>
            {data.program?.introduction ||
              "Designed for early-career professionals, the CBA program connects business fundamentals with practical workplace decisions."}
          </p>
        </div>
        <div className="program-intro">
          <span className="pill">
            <span /> YOUR LEARNING PATH
          </span>
          <button className="text-link" onClick={() => go("/courses")}>
            Explore the full curriculum <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="course-grid">
          {courses.slice(0, 4).map((c, i) => (
            <CourseCard
              completed={completed}
              saved={saved}
              toggleSaved={toggleSaved}
              go={go}
              enrolled={!!data.enrolled}
              key={c.id}
              c={c}
              i={i}
            />
          ))}
        </div>
        <div className="center">
          <Button secondary onClick={() => go("/courses")}>
            View all courses <ArrowRight size={18} />
          </Button>
        </div>
      </section>
      <section className="purpose-band" id="approach">
        <div className="purpose-photo">
          <Image
            sizes="(max-width: 760px) 90vw, 45vw"
            src="/workshop.jpg"
            alt="Professionals learning together at a MOWE Global workshop"
            loading="lazy"
            decoding="async"
            width={1200}
            height={800}
          />
          <span>REAL PEOPLE. REAL-WORLD LEARNING.</span>
        </div>
        <div className="purpose-copy">
          <div className="eyebrow red">FROM LEARNING TO DOING</div>
          <h2>
            A clear path.
            <br />A confident professional.
          </h2>
          {[
            [
              "01",
              "Build your foundation",
              "Explore business fundamentals, financial literacy and marketing.",
            ],
            [
              "02",
              "Put knowledge to work",
              "Practice with quizzes, workplace assignments, and actionable lessons.",
            ],
            [
              "03",
              "Make your progress count",
              "Complete your assessments and earn a credential you can share.",
            ],
          ].map(([n, t, d]) => (
            <div className="step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section outcomes">
        <div className="eyebrow red">
          BUILT FOR THE PROFESSIONAL YOU’RE BECOMING
        </div>
        <h2>Bring more to the table.</h2>
        <div className="outcome-grid">
          {[
            [
              Target,
              "See the bigger picture",
              "Understand how teams, decisions, and business functions connect.",
            ],
            [
              ChartNoAxesCombined,
              "Make informed decisions",
              "Build the financial, operational, and analytical skills to contribute.",
            ],
            [
              Users,
              "Grow your influence",
              "Communicate clearly, collaborate effectively, and lead with purpose.",
            ],
          ].map(([Icon, t, d]: any) => (
            <article key={t}>
              <Icon />
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="enrollment-band" id="enroll">
        <div>
          <div className="eyebrow">YOUR NEXT MOVE STARTS HERE</div>
          <h2>
            Invest in the professional
            <br />
            you’re ready to become.
          </h2>
          <p>
            Practical courses. Relevant skills. A stronger foundation for your
            future.
          </p>
        </div>
        <div className="enroll-box">
          <span>CERTIFIED BUSINESS ADMINISTRATOR</span>
          <h3>
            {Number(data.settings.price) > 0
              ? new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: data.settings.currency,
                  maximumFractionDigits: 0,
                }).format(data.settings.price)
              : "Explore the program"}
          </h3>
          <p>
            {Number(data.settings.price) > 0
              ? "Program enrollment"
              : "Enrollment details are managed by the program team."}
          </p>
          <Button onClick={enroll} disabled={!data.settings.enrollmentOpen}>
            {data.settings.enrollmentOpen
              ? "Start your journey"
              : "Enrollment closed"}{" "}
            <ArrowUpRight size={18} />
          </Button>
          <small>
            <ShieldCheck size={14} /> Your growth, thoughtfully supported.
          </small>
        </div>
      </section>
      <footer>
        <div>
          <Image
            width={135}
            height={50}
            sizes="135px"
            src="/mowe-logo.png"
            alt="MOWE Global"
          />
          <p>
            Building capability.
            <br />
            Creating possibilities.
          </p>
        </div>
        <div>
          <strong>Explore</strong>
          <button onClick={() => go("/courses")}>The CBA program</button>
          <a href="https://moweglobal.com" target="_blank" rel="noreferrer">
            MOWE Global <ArrowUpRight size={13} />
          </a>
        </div>
        <div>
          <strong>Your learning</strong>
          <button onClick={() => go("/dashboard")}>Learner dashboard</button>
          <button onClick={() => go("/certificates")}>Your certificates</button>
        </div>
        <div className="footer-end">
          © {new Date().getFullYear()} MOWE Global.
          <br />
          Built for the next chapter.
        </div>
      </footer>
    </>
  );
}
