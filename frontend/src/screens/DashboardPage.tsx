"use client";

import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  Target,
} from "lucide-react";
import { Button, Stat } from "../components/ui";
import { LockedBadge } from "../components/courses/CourseLocked";
import { courseImages } from "../lib/courseImages";
import { icons } from "../lib/coursePresentation";
import { lessons } from "../lib/curriculum";
import { myCoursesPath } from "../lib/publicNavigation";

import { useAcademy } from "../providers/AcademyProvider";

export default function DashboardPage() {
  const {
    data,
    courses,
    courseAccess,
    courseWorkDone,
    user,
    allLessons,
    completed,
    percent,
    go,
    enroll,
    nextLesson,
    nextActivity,
    nextCourse,
    nextCourseImage,
    learningLink,
  } = useAcademy();
  const needsPayment =
    nextCourse && courseAccess[nextCourse.id]?.status === "payment_required";
  return (
    <>
      <div className="page-title">
        <div className="eyebrow red">YOUR NEXT CHAPTER</div>
        <h1>
          Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Let’s keep
          growing.
        </h1>
        <p>A little progress today. More possibilities tomorrow.</p>
      </div>
      <div className="dashboard-stats">
        <Stat
          title="Program progress"
          value={`${percent}%`}
          icon={ChartNoAxesCombined}
        />
        <Stat
          title="Lessons completed"
          value={`${completed.size} / ${allLessons.length}`}
          icon={CheckCircle2}
        />
        <Stat
          title="Assessments passed"
          value={`${new Set((data.attempts || []).filter((a: any) => a.status === "graded" && a.score >= 70).map((a: any) => a.course_id)).size}`}
          icon={Target}
        />
        <Stat
          title="Your certificates"
          value={data.certificates?.length || 0}
          icon={Award}
        />
      </div>
      <div className="dashboard-columns">
        <section>
          <div className="small-heading">
            <h2>
              {data.enrolled
                ? "Continue your journey"
                : "Your learning starts here"}
            </h2>
            <span className="pill">CBA PROGRAM</span>
          </div>
          <div
            className={`continue-card ${nextCourseImage ? "has-course-image" : ""}`}
          >
            <div>
              <span className="eyebrow">
                {data.enrolled ? "YOUR NEXT STEP" : "CBA PROGRAMME"}
              </span>
              <h2>{nextCourse?.title || "Certified Business Administrator"}</h2>
              <p>
                {needsPayment
                  ? "Choose a payment option to unlock this course."
                  : data.enrolled
                    ? nextLesson?.title ||
                      (nextActivity === "assessment"
                        ? "Course assessment"
                        : nextActivity === "assignment"
                          ? "Workplace assignment"
                          : courseWorkDone
                            ? "You’ve completed the coursework."
                            : "Explore your learning path.")
                    : "Build practical skills across business fundamentals, finance, and marketing."}
              </p>
              <Button
                onClick={() =>
                  needsPayment || data.enrolled ? go(learningLink) : enroll()
                }
              >
                {courseWorkDone
                  ? "View certificates"
                  : needsPayment
                    ? "View payment options"
                    : data.enrolled
                      ? "Continue learning"
                      : "Enroll in the program"}{" "}
                <ArrowRight size={18} />
              </Button>
            </div>
            {nextCourseImage ? (
              <Image
                sizes="(max-width: 760px) 90vw, 260px"
                className="continue-course-image"
                src={nextCourseImage.src}
                alt={nextCourseImage.alt}
                width={nextCourseImage.width}
                height={nextCourseImage.height}
                decoding="async"
                style={{
                  objectFit: nextCourseImage.fit,
                  backgroundColor: nextCourseImage.background,
                }}
              />
            ) : (
              <BookOpen size={115} strokeWidth={0.7} />
            )}
          </div>
          <div className="small-heading">
            <h2>Your learning path</h2>
            <button className="text-link" onClick={() => go(myCoursesPath)}>
              View all <ArrowRight size={16} />
            </button>
          </div>
          <div className="learning-list">
            {courses.slice(0, 4).map((c, i) => {
              const Icon = icons[i % icons.length];
              const artwork = courseImages[c.id];
              const done = lessons(c).filter((l) => completed.has(l.id)).length;
              const locked = courseAccess[c.id]?.status === "locked";
              const unpaid = courseAccess[c.id]?.status === "payment_required";
              return (
                <button
                  key={c.id}
                  onClick={() => go(unpaid ? "/payments" : `/course/${c.id}`)}
                >
                  <span className={`list-icon art-${i}`}>
                    {artwork ? (
                      <Image
                        sizes="(max-width: 760px) 90vw, 45vw"
                        src={artwork.src}
                        alt=""
                        width={47}
                        height={47}
                        loading="lazy"
                        decoding="async"
                        style={{
                          objectFit: artwork.fit,
                          backgroundColor: artwork.background,
                        }}
                      />
                    ) : (
                      <Icon size={23} />
                    )}
                  </span>
                  <div>
                    <strong>{c.title}</strong>
                    {locked ? (
                      <LockedBadge />
                    ) : (
                      <span>
                        {unpaid
                          ? "Payment required"
                          : courseAccess[c.id]?.status === "completed"
                            ? "Course completed"
                            : `${done} of ${lessons(c).length} lessons completed`}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={20} />
                </button>
              );
            })}
          </div>
        </section>
        <aside>
          <div className="goal-card">
            <div className="small-heading">
              <h3>Your bigger picture</h3>
            </div>
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(var(--red) ${percent}%, var(--line) 0)`,
              }}
            >
              <span>
                <strong>{percent}%</strong>
                <small>of your program</small>
              </span>
            </div>
            <p>
              Every lesson is a step towards
              <br />
              the professional you want to be.
            </p>
          </div>
          <div className="tip-card">
            <h3>Make room for growth.</h3>
            <p>
              Set aside a little time each week. Consistency turns learning into
              lasting capability.
            </p>
            <button className="text-link" onClick={() => go(myCoursesPath)}>
              Find your next lesson <ArrowUpRight size={16} />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
