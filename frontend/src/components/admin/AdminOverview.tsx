"use client";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "../ui";
type Overview = {
  enrolledLearners: number;
  publishedCourses: number;
  completedLessons: number;
  pendingReviews: number;
  courseProgress: {
    id: string;
    title: string;
    lessonCount: number;
    completed: number;
    possible: number;
    percent: number;
  }[];
};
const number = (value: number) => new Intl.NumberFormat("en-GB").format(value);
export default function AdminOverview({
  overview,
  refreshing,
  refresh,
}: {
  overview?: Overview;
  refreshing: boolean;
  refresh: () => Promise<unknown>;
}) {
  if (!overview) return <LoadingState label="Loading academy overview" />;
  const metrics = [
    {
      label: "Enrolled learners",
      value: overview.enrolledLearners,
      icon: Users,
      href: "/admin/students",
    },
    {
      label: "Published courses",
      value: overview.publishedCourses,
      icon: BookOpen,
      href: "/admin/courses",
    },
    {
      label: "Lessons completed",
      value: overview.completedLessons,
      icon: CheckCircle2,
      href: "/admin/students",
    },
    {
      label: "Needs review",
      value: overview.pendingReviews,
      icon: ClipboardCheck,
      href: "/admin/review",
    },
  ];
  return (
    <div className="admin-overview-page">
      <div className="library-breadcrumb">
        <span>Academy</span>
        <span>/</span>
        <span>Overview</span>
      </div>
      <header className="library-heading">
        <div>
          <h1>Overview</h1>
          <p>Enrollment, learning progress and assessment activity.</p>
        </div>
        <button
          className="overview-refresh"
          disabled={refreshing}
          onClick={() => refresh()}
        >
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />
          {refreshing ? "Updating…" : "Refresh"}
        </button>
      </header>
      <div className="overview-metrics">
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <Link href={href} className="overview-metric" key={label}>
            <span>
              {label}
              <Icon size={19} />
            </span>
            <strong>{number(value)}</strong>
            <small>
              View details
              <ArrowRight size={13} />
            </small>
          </Link>
        ))}
      </div>
      <section className="overview-progress">
        <header>
          <div>
            <h2>Course progress</h2>
            <p>Completed lessons across enrolled learners.</p>
          </div>
          <Link href="/admin/courses">
            Content library
            <ArrowRight size={15} />
          </Link>
        </header>
        {overview.courseProgress.length ? (
          <div className="overview-course-list">
            {overview.courseProgress.map((course) => (
              <div className="overview-course-row" key={course.id}>
                <div>
                  <Link href={`/admin/courses/${course.id}`}>
                    {course.title}
                  </Link>
                  <small>
                    {number(course.completed)} of {number(course.possible)}{" "}
                    lesson completions<span>·</span>
                    {course.lessonCount} lessons per learner
                  </small>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={course.title + " completion"}
                    aria-valuenow={course.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <i style={{ width: course.percent + "%" }} />
                  </div>
                </div>
                <strong>{course.percent}%</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="overview-no-courses">
            <BookOpen size={28} />
            <h3>No published courses</h3>
            <p>Publish a course to begin tracking learner progress.</p>
            <Link href="/admin/courses/new">
              Create course
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
      <div className="overview-shortcuts">
        <Link href="/admin/review">
          <ClipboardCheck size={21} />
          <span>
            <strong>Review assessments</strong>
            <small>
              {overview.pendingReviews
                ? number(overview.pendingReviews) + " awaiting review"
                : "No assessments awaiting review"}
            </small>
          </span>
          <ArrowRight size={17} />
        </Link>
        <Link href="/admin/students">
          <Users size={21} />
          <span>
            <strong>Manage learners</strong>
            <small>Enrollment and individual progress</small>
          </span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}
