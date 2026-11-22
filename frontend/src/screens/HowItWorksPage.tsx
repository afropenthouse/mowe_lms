"use client";

import { ArrowRight, Award, ChevronDown } from "lucide-react";
import Link from "next/link";
import ProgramCallout from "../components/public/ProgramCallout";
import { useAcademy } from "../providers/AcademyProvider";

const steps = (open: boolean, paid: boolean) => [
  [
    "Create and verify your account",
    "Sign up with your email address and enter the verification code we send you.",
  ],
  [
    paid ? "Choose how to pay" : "Join the program",
    paid
      ? "Open Payments in your dashboard and complete your learner details. You can pay for the first course or buy the full eight-course program."
      : "Open My courses and select a course to join the program for free.",
  ],
  [
    "Study and complete your assessments",
    open
      ? "Choose from any of the eight courses. Each course includes interactive lessons, a quiz and an assignment."
      : "Start with Business Fundamentals & Corporate Structure. Finish each course before moving on to the next.",
  ],
  [
    "Claim your certificate",
    "Once you’ve met the program’s completion requirements, open Certificates in your dashboard to claim your credential.",
  ],
];

const questions = (open: boolean) => [
  [
    "Can I see the lessons before I sign up?",
    "You can browse the course outlines and try the free demo before signing up.",
  ],
  [
    "Can I skip ahead to another course?",
    open
      ? "Yes. You can study any course or lesson after joining the program."
      : "Courses open one at a time. Select a locked course to see what you need to finish first.",
  ],
  [
    "Do I need to finish a course in one sitting?",
    "No. You can work at your own pace. Your learner dashboard saves your progress so you can pick up where you left off.",
  ],
  [
    "Do I get a certificate for every course?",
    "You earn one CBA certificate for completing the full program. There is no separate charge to claim it.",
  ],
];

export default function HowItWorksPage() {
  const { data } = useAcademy();
  const open = data.openCourseAccess !== false;
  return (
    <div className="visitor-page">
      <section className="visitor-process-hero">
        <div className="visitor-wrap visitor-process-intro">
          <div>
            <span className="visitor-label">THE LEARNER JOURNEY</span>
            <h1>How it works</h1>
            <p>
              From creating your account to earning your CBA certificate, here’s
              what to expect at each step.
            </p>
          </div>
          <div className="visitor-credential">
            <Award size={28} aria-hidden="true" />
            <div>
              <strong>One program certificate</strong>
              <p>Earned by completing the CBA program.</p>
            </div>
          </div>
        </div>
      </section>
      <div className="visitor-wrap visitor-process-content">
        <section>
          <h2>Your path through the program</h2>
          <ol className="visitor-steps">
            {steps(open, Boolean(data.paymentsRequired)).map(
              ([title, description], index) => (
                <li key={title}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ),
            )}
          </ol>
        </section>
        <aside className="visitor-faq">
          <h2>Common questions</h2>
          {questions(open).map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
          <Link className="text-link" href="/courses">
            Browse the courses <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </aside>
      </div>
      <ProgramCallout />
    </div>
  );
}
