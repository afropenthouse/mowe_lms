"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  GraduationCap,
  Target,
} from "lucide-react";
import { Button, Empty, LoadingState, RichText } from "../components/ui";
import { lessons } from "../lib/curriculum";
import { useAcademy } from "../providers/AcademyProvider";
import CourseOutline, {
  OutlineToggle,
  useCourseOutline,
} from "../components/courses/CourseOutline";
export default function CourseDetailPage() {
  const { data, busy, completed, go, course, loading, user, action } =
    useAcademy();
  const [selected, setSelected] = useState<string | null>(null);
  const outline = useCourseOutline();
  if (loading) return <LoadingState label="Loading course" />;
  if (!course || !course.modules.some((m) => m.lessons.length))
    return (
      <Empty title="Course unavailable">
        Browse the published curriculum to choose a course.
      </Empty>
    );
  const all = lessons(course),
    lesson = all.find((l) => l.id === selected);
  const next = all.find((l) => !completed.has(l.id)) || all[0],
    count = all.filter((l) => completed.has(l.id)).length;
  async function start(id: string, tab?: string) {
    const destination = `/learn/${course!.id}/${id}${tab ? "?tab=" + tab : ""}`;
    if (!user) {
      go("/signup?next=" + encodeURIComponent(destination));
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
    go(destination);
  }
  function preview(id: string | null) {
    setSelected(id);
    document
      .getElementById("course-reading")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          activeId={lesson?.id}
          open={outline.open}
          onClose={outline.close}
          onLesson={preview}
          onOverview={() => preview(null)}
          onAssessment={() => start(next.id, "assessment")}
          onAssignment={() => start(next.id, "assignment")}
        />
        <div className="course-study-main" id="course-reading">
          {lesson ? (
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
                {all[all.indexOf(lesson) + 1] && (
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
                    {course.modules.length} modules · {all.length} lessons
                  </span>
                  <span>
                    <Clock size={17} />
                    {Math.floor(
                      all.reduce((sum, l) => sum + l.duration, 0) / 60,
                    )}
                    h {all.reduce((sum, l) => sum + l.duration, 0) % 60}m with
                    practice
                  </span>
                  <span>
                    <Target size={17} />
                    {course.quiz.questions.length}-question quiz
                  </span>
                </div>
                <div className="course-hero-actions">
                  <Button disabled={busy} onClick={() => start(next.id)}>
                    {count
                      ? "Continue learning"
                      : data.enrolled
                        ? "Start this course"
                        : "Join & start learning"}
                    <ArrowRight size={18} />
                  </Button>
                  <button onClick={() => preview(all[0].id)}>
                    Preview the first lesson
                  </button>
                </div>
              </section>
              <section className="course-learning-intro">
                <div>
                  <span className="eyebrow red">
                    LEARN IT. WORK THROUGH IT. APPLY IT.
                  </span>
                  <h2>A complete path through each topic.</h2>
                  <p>
                    Each module combines a core lesson, a worked case study and
                    a guided workshop. Build your understanding, practise a
                    decision, then apply it to your own workplace.
                  </p>
                </div>
                <div className="course-outcomes">
                  <span>
                    <BookOpen size={19} />
                    Clear explanations
                  </span>
                  <span>
                    <FileText size={19} />
                    Worked cases & exercises
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
                  <h2>Your course curriculum</h2>
                  <span>{all.length} lessons</span>
                </div>
                {course.modules.map((m, index) => (
                  <details
                    className="study-module-card"
                    key={m.id}
                    open={index === 0}
                  >
                    <summary>
                      <span className="study-module-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <strong>{m.title}</strong>
                        <small>
                          {m.lessons.length} lessons ·{" "}
                          {m.lessons.reduce((sum, l) => sum + l.duration, 0)}{" "}
                          min
                        </small>
                      </span>
                      <ChevronDown size={18} />
                    </summary>
                    <div className="study-module-lessons">
                      {m.lessons.map((l, i) => (
                        <button key={l.id} onClick={() => preview(l.id)}>
                          <span className="study-lesson-index">{i + 1}</span>
                          <span>
                            <strong>{l.title}</strong>
                            <small>
                              {i === 0
                                ? "Understand the principles"
                                : /workshop$/.test(l.id)
                                  ? "Build a practical work product"
                                  : "Work through a realistic decision"}
                            </small>
                          </span>
                          <span>{l.duration} min</span>
                          {completed.has(l.id) ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <ArrowRight size={17} />
                          )}
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </section>
              <section className="course-finish-card">
                <div>
                  <span className="eyebrow red">PUT IT INTO PRACTICE</span>
                  <h2>{course.assignment.title}</h2>
                  <p>{course.assignment.prompt}</p>
                </div>
                <Button
                  secondary
                  disabled={busy}
                  onClick={() => start(next.id, "assignment")}
                >
                  View assignment
                  <ArrowRight size={16} />
                </Button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
