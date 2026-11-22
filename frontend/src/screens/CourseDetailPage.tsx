"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CirclePlay,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  Target,
} from "lucide-react";
import { Button, Empty, LoadingState, RichText } from "../components/ui";
import LessonView from "../components/LessonPlayer";
import {
  courseActivityPath,
  readCourseActivity,
  type CourseActivity,
} from "../lib/courseActivity";
import { lessons } from "../lib/curriculum";
import CourseLocked, {
  CoursePaymentRequired,
} from "../components/courses/CourseLocked";
import { useAcademy } from "../providers/AcademyProvider";
import CourseOutline, {
  OutlineToggle,
  useCourseOutline,
} from "../components/courses/CourseOutline";
export default function CourseDetailPage() {
  const {
    data,
    busy,
    completed,
    go,
    course,
    courses,
    courseAccess,
    learningLink,
    loading,
    user,
    action,
    upload,
    courseWorkDone,
    refresh,
  } = useAcademy();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const search = useSearchParams();
  const lessonId = search.get("lesson");
  const activity = readCourseActivity(search.get("tab"));
  const reading = useRef<HTMLDivElement>(null);
  const previousSelection = useRef({ lessonId, activity });
  const outline = useCourseOutline();
  useEffect(() => {
    const previous = previousSelection.current;
    previousSelection.current = { lessonId, activity };
    if (previous.lessonId === lessonId && previous.activity === activity)
      return;
    reading.current?.focus({ preventScroll: true });
    reading.current?.scrollIntoView({ block: "start" });
  }, [lessonId, activity]);
  if (loading) return <LoadingState label="Loading course" />;
  if (!course || !course.modules.some((m) => m.lessons.length))
    return (
      <Empty title="Course unavailable">
        Browse the published curriculum to choose a course.
      </Empty>
    );
  const courseId = course.id;
  const all = lessons(course);
  const selected = all.find((entry) => entry.id === lessonId);
  const lesson = all.find(
    (entry) => entry.id === previewId && entry.content && !entry.embedUrl,
  );
  const access = courseAccess[course.id];
  if (access?.status === "payment_required")
    return <CoursePaymentRequired title={course.title} />;
  if (access?.status === "locked") {
    return (
      <CourseLocked
        title={course.title}
        prerequisite={
          courses.find(({ id }) => id === access.prerequisiteId)?.title ??
          "the previous course"
        }
        continueTo={data.enrolled ? learningLink : "/dashboard"}
      />
    );
  }
  const canStudy = Boolean(data.enrolled || user?.role === "admin");
  const next = all.find((l) => !completed.has(l.id)) || all[0],
    count = all.filter((l) => completed.has(l.id)).length;
  const questionCount = course.questionCount ?? course.quiz.questions.length;
  const hasAssignment =
    course.hasAssignment ?? Boolean(course.assignment.prompt.trim());
  function showActivity(id?: string, tab?: CourseActivity) {
    setPreviewId(null);
    const destination = courseActivityPath(courseId, id, tab);
    if (destination !== window.location.pathname + window.location.search)
      window.history.pushState(null, "", destination);
  }
  async function start(id: string, tab?: CourseActivity) {
    if (!user) {
      go(
        "/signup?next=" +
          encodeURIComponent(
            data.paymentsRequired
              ? "/payments"
              : courseActivityPath(courseId, id, tab),
          ),
      );
      return;
    }
    if (!data.enrolled) {
      const result = await action(
        "enroll",
        {},
        "You’re enrolled. Your learning starts here.",
      );
      if (!result) return;
    }
    showActivity(id, tab);
  }
  function preview(id: string | null) {
    setPreviewId(id);
    reading.current?.scrollIntoView({ block: "start" });
  }
  function openLesson(id: string) {
    const entry = all.find((item) => item.id === id);
    if (!canStudy && entry?.content && !entry.embedUrl) preview(id);
    else void start(id);
  }
  return (
    <div className="course-study">
      <div className="course-study-toolbar">
        <button className="text-link" onClick={() => go("/courses")}>
          <ArrowLeft size={16} />
          All courses
        </button>
        <OutlineToggle open={outline.open} onClick={outline.toggle} />
      </div>
      <div
        className={`course-study-layout ${outline.open ? "" : "outline-is-closed"}`}
      >
        <CourseOutline
          course={course}
          completed={completed}
          activeId={selected?.id ?? lesson?.id}
          activity={selected ? activity : undefined}
          open={outline.open}
          onClose={outline.close}
          onLesson={openLesson}
          onOverview={() => showActivity()}
          onAssessment={
            questionCount
              ? () => start(selected?.id ?? next.id, "assessment")
              : undefined
          }
          onAssignment={
            hasAssignment
              ? () => start(selected?.id ?? next.id, "assignment")
              : undefined
          }
        />
        <div
          className="course-study-main"
          ref={reading}
          tabIndex={-1}
          aria-label="Course content"
        >
          {selected && user ? (
            <LessonView
              key={selected.id}
              course={course}
              lessonId={selected.id}
              tab={activity}
              setTab={(tab: CourseActivity) => showActivity(selected.id, tab)}
              onLesson={openLesson}
              data={data}
              busy={busy}
              go={go}
              action={action}
              upload={upload}
              completed={completed}
              courseComplete={access?.status === "completed"}
              courseWorkDone={courseWorkDone}
              learningLink={learningLink}
              refresh={refresh}
            />
          ) : selected ? (
            <Empty title={selected.title}>
              <Button onClick={() => start(selected.id, activity)}>
                Join &amp; start learning
              </Button>
            </Empty>
          ) : lesson ? (
            <>
              <div className="course-preview-heading">
                <span className="eyebrow red">EXPLORE THE LESSON</span>
                <h1>{lesson.title}</h1>
                <p>
                  <Clock size={16} />
                  {lesson.duration} minutes · {course.instructor}
                </p>
                <Button disabled={busy} onClick={() => start(lesson.id)}>
                  {data.enrolled
                    ? "Open in learning space"
                    : "Join & start learning"}
                  <ArrowRight size={17} />
                </Button>
              </div>
              <article className="panel course-reading-panel">
                <RichText text={lesson.content} />
              </article>
              <div className="course-preview-actions">
                <button className="text-link" onClick={() => preview(null)}>
                  <ArrowLeft size={16} />
                  Back to course overview
                </button>
                {all[all.indexOf(lesson) + 1]?.content && (
                  <Button
                    secondary
                    onClick={() => preview(all[all.indexOf(lesson) + 1].id)}
                  >
                    Next lesson preview
                    <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <section className="course-study-hero">
                <span className="eyebrow">CBA PROGRAMME</span>
                <h1>{course.title}</h1>
                <p>{course.description}</p>
                <div className="course-study-meta">
                  <span>
                    <BookOpen size={17} />
                    {all.length} {all.length === 1 ? "lesson" : "lessons"}
                  </span>
                  <span>
                    <Target size={17} />
                    {questionCount}
                    -question quiz
                  </span>
                </div>
                <div className="course-hero-actions">
                  <Button
                    disabled={busy}
                    onClick={() => {
                      if (data.enrolled && access?.status === "available")
                        start(
                          access.lessonId,
                          access.activity === "lesson"
                            ? undefined
                            : access.activity,
                        );
                      else start(next.id);
                    }}
                  >
                    {count
                      ? "Continue learning"
                      : data.enrolled
                        ? "Start this course"
                        : "Join & start learning"}
                    <ArrowRight size={18} />
                  </Button>
                  {all[0].content && (
                    <button onClick={() => preview(all[0].id)}>
                      Preview the first lesson
                    </button>
                  )}
                </div>
              </section>
              <section className="course-learning-intro">
                <div>
                  <span className="eyebrow red">
                    LEARN IT. WORK THROUGH IT. APPLY IT.
                  </span>
                  <h2>A complete path through each topic.</h2>
                  <p>
                    Open a lesson from the curriculum to study, then take the
                    course quiz and complete the assignment.
                  </p>
                </div>
                <div className="course-outcomes">
                  <span>
                    <BookOpen size={19} />
                    Interactive lessons
                  </span>
                  <span>
                    <CheckCircle2 size={19} />
                    Quizzes with feedback
                  </span>
                  <span>
                    <GraduationCap size={19} />A practical assignment
                  </span>
                </div>
              </section>
              <section className="course-syllabus">
                <div className="small-heading">
                  <h2>Lessons</h2>
                  <span>{all.length} lessons</span>
                </div>
                <ol className="study-lesson-list">
                  {all.map((lesson, index) => (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        disabled={busy || lesson.placeholder}
                        onClick={() => openLesson(lesson.id)}
                      >
                        <span className="study-lesson-index" aria-hidden="true">
                          {index + 1}
                        </span>
                        <strong>{lesson.title}</strong>
                        {completed.has(lesson.id) && (
                          <span className="study-lesson-completed">
                            <CheckCircle2 size={16} /> Completed
                          </span>
                        )}
                        <CirclePlay size={22} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
              {(questionCount > 0 || hasAssignment) && (
                <section className="course-assessments">
                  <h2>Quiz and assignment</h2>
                  <div className="course-assessment-list">
                    {questionCount > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => start(next.id, "assessment")}
                      >
                        <ClipboardCheck size={20} aria-hidden="true" />
                        <span>
                          <strong>Course quiz</strong>
                          <small>
                            {questionCount} questions · {course.quiz.passScore}%
                            to pass
                          </small>
                        </span>
                        <ArrowRight size={17} aria-hidden="true" />
                      </button>
                    )}
                    {hasAssignment && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => start(next.id, "assignment")}
                      >
                        <FileText size={20} aria-hidden="true" />
                        <span>
                          <strong>Workplace assignment</strong>
                          <small>{course.assignment.title}</small>
                        </span>
                        <ArrowRight size={17} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
