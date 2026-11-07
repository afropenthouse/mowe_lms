"use client";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Course } from "../../lib/types";
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
            onClick={() => choose(onOverview)}
          >
            <BookOpen size={17} />
            Course overview
          </button>
          {course.modules.map((module, index) => {
            const matching = module.title
              .toLowerCase()
              .includes(query.toLowerCase());
            const visible = module.lessons.filter(
              (l) =>
                matching || l.title.toLowerCase().includes(query.toLowerCase()),
            );
            if (!visible.length) return null;
            return (
              <details
                className="outline-module"
                key={module.id}
                open={
                  !!query ||
                  module.lessons.some((l) => l.id === activeId) ||
                  (!activeId && index === 0)
                }
              >
                <summary>
                  <span>
                    <small>
                      MODULE {String(index + 1).padStart(2, "0")} ·{" "}
                      {module.lessons.length} LESSONS
                    </small>
                    <strong>{module.title}</strong>
                  </span>
                  <ChevronDown size={16} />
                </summary>
                {visible.map((l) => (
                  <button
                    key={l.id}
                    className={
                      l.id === activeId
                        ? "outline-lesson active"
                        : "outline-lesson"
                    }
                    aria-current={l.id === activeId ? "step" : undefined}
                    onClick={() => choose(() => onLesson(l.id))}
                  >
                    {completed.has(l.id) ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <span className="outline-lesson-number">
                        {module.lessons.findIndex((item) => item.id === l.id) +
                          1}
                      </span>
                    )}
                    <span>
                      {l.title}
                      <small>
                        {l.duration} min ·{" "}
                        {completed.has(l.id) ? "Completed" : "Text & practice"}
                      </small>
                    </span>
                  </button>
                ))}
              </details>
            );
          })}
          {query &&
            !all.some((l) =>
              l.title.toLowerCase().includes(query.toLowerCase()),
            ) &&
            !course.modules.some((m) =>
              m.title.toLowerCase().includes(query.toLowerCase()),
            ) && (
              <p className="outline-no-results">
                No lessons match your search.
              </p>
            )}
          {onAssessment && (
            <button
              className="outline-activity"
              onClick={() => choose(onAssessment)}
            >
              <ClipboardCheck size={18} />
              <span>
                Course quiz
                <small>
                  {course.quiz.questions.length} questions ·{" "}
                  {course.quiz.passScore}% to pass
                </small>
              </span>
            </button>
          )}
          {onAssignment && (
            <button
              className="outline-activity"
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
