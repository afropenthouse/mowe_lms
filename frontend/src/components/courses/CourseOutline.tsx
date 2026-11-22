"use client";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Course } from "../../lib/types";
import type { CourseActivity } from "../../lib/courseActivity";
import { lessons } from "../../lib/curriculum";
export function useCourseOutline() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mowe-course-outline");
      setOpen(
        saved === null
          ? window.matchMedia("(min-width: 1100px)").matches
          : saved === "open",
      );
    } catch {
      setOpen(window.matchMedia("(min-width: 1100px)").matches);
    }
  }, []);
  function change(value: boolean) {
    setOpen(value);
    if (!value)
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>('[aria-controls="course-outline"]')
          ?.focus(),
      );
    try {
      localStorage.setItem("mowe-course-outline", value ? "open" : "closed");
    } catch {}
  }
  return { open, toggle: () => change(!open), close: () => change(false) };
}
export function OutlineToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="outline-toggle"
      aria-expanded={open}
      aria-controls="course-outline"
      onClick={onClick}
    >
      {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      {open ? "Hide course outline" : "Show course outline"}
    </button>
  );
}
export default function CourseOutline({
  course,
  completed,
  activeId,
  activity,
  open,
  onClose,
  onLesson,
  onOverview,
  onAssessment,
  onAssignment,
}: {
  course: Course;
  completed: Set<string>;
  activeId?: string;
  activity?: CourseActivity;
  open: boolean;
  onClose: () => void;
  onLesson: (id: string) => void;
  onOverview: () => void;
  onAssessment?: () => void;
  onAssignment?: () => void;
}) {
  const [query, setQuery] = useState(""),
    [mobile, setMobile] = useState(false);
  const panel = useRef<HTMLElement>(null),
    close = useRef<HTMLButtonElement>(null);
  const all = lessons(course),
    done = all.filter((l) => completed.has(l.id)).length;
  const search = query.trim().toLowerCase();
  const visibleLessons = all
    .map((lesson, index) => ({ lesson, number: index + 1 }))
    .filter(({ lesson }) => lesson.title.toLowerCase().includes(search));
  const quizActive = activity === "assessment";
  const assignmentActive = activity === "assignment";
  const currentLessonId = quizActive || assignmentActive ? undefined : activeId;
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1099px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, mobile]);
  function choose(callback: () => void) {
    callback();
    if (mobile) onClose();
  }
  if (!open) return null;
  return (
    <>
      {mobile && (
        <button
          className="outline-backdrop"
          aria-label="Close course outline"
          onClick={onClose}
          tabIndex={-1}
        />
      )}
      <aside
        id="course-outline"
        className="course-outline"
        ref={panel}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile || undefined}
        aria-label="Course outline"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
          if (e.key === "Tab" && mobile) {
            const items = panel.current?.querySelectorAll<HTMLElement>(
              "button:not([disabled]), input, summary, a[href]",
            );
            if (!items?.length) return;
            const visible = Array.from(items).filter(
                (el) => el.getClientRects().length,
              ),
              first = visible[0],
              last = visible[visible.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div className="outline-heading">
          <div>
            <span className="eyebrow red">YOUR LEARNING PATH</span>
            <h2>Course outline</h2>
          </div>
          <button
            ref={close}
            className="icon-btn"
            aria-label="Close course outline"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <p className="outline-course-title">{course.title}</p>
        <div className="outline-progress">
          <span>
            {done} of {all.length} lessons complete
          </span>
          <b>{Math.round((done / Math.max(1, all.length)) * 100)}%</b>
          <div className="progress-track">
            <i
              style={{ width: (done / Math.max(1, all.length)) * 100 + "%" }}
            />
          </div>
        </div>
        <label className="outline-search">
          <Search size={16} />
          <input
            aria-label="Find a lesson"
            placeholder="Find a lesson…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <nav
          aria-label="Lessons and course activities"
          className="outline-lessons"
        >
          <button
            className={
              !activeId ? "outline-overview active" : "outline-overview"
            }
            aria-current={!activeId ? "page" : undefined}
            onClick={() => choose(onOverview)}
          >
            <BookOpen size={17} />
            Course overview
          </button>
          <ol className="outline-lesson-list" aria-label="Lessons">
            {visibleLessons.map(({ lesson: l, number }) => (
              <li key={l.id}>
                <button
                  type="button"
                  className={
                    l.id === currentLessonId
                      ? "outline-lesson active"
                      : "outline-lesson"
                  }
                  aria-current={l.id === currentLessonId ? "step" : undefined}
                  disabled={l.placeholder}
                  onClick={() => choose(() => onLesson(l.id))}
                >
                  <span className="outline-lesson-number" aria-hidden="true">
                    {number}
                  </span>
                  <span>
                    {l.title}
                    {completed.has(l.id) && (
                      <small>
                        <CheckCircle2 size={12} /> Completed
                      </small>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {search && visibleLessons.length === 0 && (
            <p className="outline-no-results">No lessons match your search.</p>
          )}
          {onAssessment && (
            <button
              className={
                quizActive ? "outline-activity active" : "outline-activity"
              }
              aria-current={quizActive ? "step" : undefined}
              onClick={() => choose(onAssessment)}
            >
              <ClipboardCheck size={18} />
              <span>
                Course quiz
                <small>
                  {course.questionCount ?? course.quiz.questions.length}{" "}
                  questions · {course.quiz.passScore}% to pass
                </small>
              </span>
            </button>
          )}
          {onAssignment && (
            <button
              className={
                assignmentActive
                  ? "outline-activity active"
                  : "outline-activity"
              }
              aria-current={assignmentActive ? "step" : undefined}
              onClick={() => choose(onAssignment)}
            >
              <FileText size={18} />
              <span>
                Workplace assignment<small>Apply what you have learned</small>
              </span>
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
