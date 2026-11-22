"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProgramCallout from "../components/public/ProgramCallout";
import { LockedBadge } from "../components/courses/CourseLocked";
import CourseLockButton from "../components/courses/CourseLockButton";
import { Empty, LoadingState } from "../components/ui";
import { courseImages } from "../lib/courseImages";
import { lessons } from "../lib/curriculum";
import { useAcademy } from "../providers/AcademyProvider";

export default function PublicCoursesPage() {
  const { courses, courseAccess, loading, error } = useAcademy();
  return (
    <div className="visitor-page">
      <section className="visitor-catalog-intro">
        <div className="visitor-wrap">
          <span className="visitor-label">CBA CURRICULUM</span>
          <h1>Our courses</h1>
          <p>
            Explore what each course covers, then open an outline or preview a
            lesson before you enroll.
          </p>
          <Link className="text-link" href="/program">
            See the program overview <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <div className="visitor-wrap visitor-catalog">
        {loading && <LoadingState label="Loading the published courses" />}
        <div className="visitor-course-grid">
          {courses.map((course) => {
            const artwork = courseImages[course.id];
            const lessonCount = lessons(course).length;
            const locked = courseAccess[course.id]?.status === "locked";
            return (
              <article className="visitor-course" key={course.id}>
                <div
                  className="visitor-course-art"
                  style={artwork && { backgroundColor: artwork.background }}
                >
                  {artwork ? (
                    <Image
                      src={artwork.src}
                      alt={artwork.alt}
                      fill
                      sizes="(max-width: 580px) 90vw, (max-width: 950px) 46vw, 380px"
                      style={{ objectFit: artwork.fit }}
                    />
                  ) : (
                    <BookOpen size={48} strokeWidth={1.25} aria-hidden="true" />
                  )}
                </div>
                <div className="visitor-course-copy">
                  {locked ? (
                    <LockedBadge />
                  ) : (
                    <p className="visitor-course-meta">
                      <BookOpen size={15} aria-hidden="true" />
                      {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                    </p>
                  )}
                  <h2>
                    <Link href={`/course/${course.id}`}>{course.title}</Link>
                  </h2>
                  <p>{course.description}</p>
                  {locked ? (
                    <CourseLockButton course={course} />
                  ) : (
                    <Link
                      className="text-link"
                      href={`/course/${course.id}`}
                      aria-label={`View outline for ${course.title}`}
                    >
                      View course outline{" "}
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {!loading && !courses.length && !error && (
          <Empty title="No published courses yet">
            Check back for the latest curriculum.
          </Empty>
        )}
      </div>
      <ProgramCallout />
    </div>
  );
}
